export class FileHandler {
  private files: File[] = [];
  private input: HTMLInputElement;
  private onFilesChanged: (files: FileList) => void;
  private allowedTypes: string[] = [];
  private maxFileSize: number = 5 * 1024 * 1024; // 5MB in bytes
  private maxFileCount: number = 5; // Maximum of 5 files
  private serverUrl: string = "https://gecko-form-tool-be-new.vercel.app";
  private accessKey: string = "";
  private sessionId: string = "";
  private uploadInProgress: boolean = false;
  private uploadQueue: File[] = [];
  private fileIdMap: Map<string, string> = new Map(); // Maps file signature to server ID

  constructor(
    input: HTMLInputElement,
    onFilesChanged: (files: FileList) => void,
    accessKey: string = "",
    sessionId: string = ""
  ) {
    this.input = input;
    this.onFilesChanged = onFilesChanged;
    this.allowedTypes = input.getAttribute("accept")?.split(",") || [];
    this.accessKey = accessKey;
    this.sessionId = sessionId;

    // Initialize with any existing files
    if (input.files && input.files.length > 0) {
      this.addFiles(input.files);
    }
  }

  /**
   * Generate a unique signature for a file to use as a key
   */
  private getFileSignature(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  /**
   * Add files to the handler's file collection
   */
  public addFiles(newFiles: FileList | File[]): boolean {
    if (!newFiles || newFiles.length === 0) return false;

    // Check if adding these files would exceed the maximum allowed
    if (this.files.length + newFiles.length > this.maxFileCount) {
      console.warn(
        `Cannot add ${newFiles.length} files. Maximum number of files allowed is ${this.maxFileCount}.`
      );
      return false;
    }

    // Check file types and size limits
    let hasError = false;

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];

      // Check file type if restrictions exist
      if (
        this.allowedTypes.length > 0 &&
        !this.allowedTypes.some((type) =>
          file.type.match(type.replace("*", ".*"))
        )
      ) {
        hasError = true;
        console.warn(`File "${file.name}" has an invalid file type.`);
        break;
      }

      // Check file size limit
      if (file.size > this.maxFileSize) {
        hasError = true;
        console.warn(
          `File "${file.name}" exceeds the maximum file size of 5MB.`
        );
        break;
      }
    }

    if (hasError) {
      return false;
    }

    // Add the new files to our collection
    Array.from(newFiles).forEach((file) => {
      this.files.push(file);

      // Add image files to upload queue
      if (file.type.startsWith("image/")) {
        this.uploadQueue.push(file);
      }
    });

    // Update the input element
    this.updateInputFiles();

    // Notify listener about the change
    this.onFilesChanged(this.getFilesAsList());

    // Process upload queue
    this.processUploadQueue();

    return true;
  }

  /**
   * Process the image upload queue
   */
  private processUploadQueue(): void {
    // If there's an upload in progress or no files to upload, exit
    if (this.uploadInProgress || this.uploadQueue.length === 0) {
      return;
    }

    // Mark as upload in progress
    this.uploadInProgress = true;

    // Get the next file to upload
    const file = this.uploadQueue.shift();

    if (!file) {
      this.uploadInProgress = false;
      return;
    }

    // Only upload images
    if (!file.type.startsWith("image/")) {
      // Not an image, move to next file
      this.uploadInProgress = false;
      this.processUploadQueue();
      return;
    }

    this.uploadImage(file).finally(() => {
      // Mark as upload complete and process the next file
      this.uploadInProgress = false;
      this.processUploadQueue();
    });
  }

  /**
   * Upload an image file
   */
  private async uploadImage(file: File): Promise<void> {
    if (!this.accessKey || !this.sessionId) {
      console.warn("Cannot upload image: missing accessKey or sessionId");
      return;
    }

    try {
      const myHeaders = new Headers();
      myHeaders.append("accept", "*/*");
      // Don't set content-type header with FormData - browser will set it with boundary

      const formdata = new FormData();
      formdata.append("file", file, file.name);
      formdata.append("formId", this.accessKey);
      formdata.append("sessionId", this.sessionId);

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: formdata,
        redirect: "follow" as RequestRedirect,
      };

      const response = await fetch(
        `${this.serverUrl}/api/forms/image-upload`,
        requestOptions
      );

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      // Parse the response to get the image ID
      const result = await response.json();
      if (result && result.id) {
        // Store the image ID with the file signature as key
        const fileSignature = this.getFileSignature(file);
        this.fileIdMap.set(fileSignature, result.id);
      } else {
        console.warn(`Upload successful but no ID returned for ${file.name}`);
      }
    } catch (error) {
      console.error("Image upload failed:", error);
    }
  }

  /**
   * Delete an image from the server
   */
  private async deleteImageFromServer(imageId: string): Promise<void> {
    if (!imageId) return;

    try {
      const response = await fetch(
        `${this.serverUrl}/api/forms/image-upload/${imageId}`,
        {
          method: "DELETE",
          redirect: "follow",
        }
      );

      if (!response.ok) {
        throw new Error(`Delete failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to delete image with ID: ${imageId}`, error);
    }
  }

  /**
   * Remove a file by its index
   */
  public removeFile(index: number): void {
    if (index >= 0 && index < this.files.length) {
      const fileToRemove = this.files[index];

      // Check if it's an image and we have an ID for it
      if (fileToRemove.type.startsWith("image/")) {
        const fileSignature = this.getFileSignature(fileToRemove);
        const imageId = this.fileIdMap.get(fileSignature);

        if (imageId) {
          // Delete the image from the server
          this.deleteImageFromServer(imageId);
          // Remove from our map
          this.fileIdMap.delete(fileSignature);
        }
      }

      // Remove the file from our array
      this.files.splice(index, 1);

      // Update UI and input
      this.updateInputFiles();
      this.onFilesChanged(this.getFilesAsList());
    }
  }

  /**
   * Clear all files
   */
  public clearFiles(): void {
    // Delete all images from server
    this.files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const fileSignature = this.getFileSignature(file);
        const imageId = this.fileIdMap.get(fileSignature);

        if (imageId) {
          this.deleteImageFromServer(imageId);
        }
      }
    });

    // Clear all local data
    this.files = [];
    this.uploadQueue = [];
    this.fileIdMap.clear();
    this.updateInputFiles();
    this.onFilesChanged(new DataTransfer().files);
  }

  /**
   * Set the session ID for uploads
   */
  public setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Set the access key for uploads
   */
  public setAccessKey(accessKey: string): void {
    this.accessKey = accessKey;
  }

  /**
   * Get all files as a FileList object
   */
  public getFilesAsList(): FileList {
    const dataTransfer = new DataTransfer();
    this.files.forEach((file) => {
      dataTransfer.items.add(file);
    });
    return dataTransfer.files;
  }

  /**
   * Update the actual input element with our files
   */
  private updateInputFiles(): void {
    const dataTransfer = new DataTransfer();
    this.files.forEach((file) => {
      dataTransfer.items.add(file);
    });
    this.input.files = dataTransfer.files;
  }

  /**
   * Get the maximum file size in bytes
   */
  public getMaxFileSize(): number {
    return this.maxFileSize;
  }

  /**
   * Set the maximum file size in bytes
   */
  public setMaxFileSize(maxSize: number): void {
    this.maxFileSize = maxSize;
  }

  /**
   * Get the maximum number of files allowed
   */
  public getMaxFileCount(): number {
    return this.maxFileCount;
  }

  /**
   * Set the maximum number of files allowed
   */
  public setMaxFileCount(maxCount: number): void {
    this.maxFileCount = maxCount;
  }

  /**
   * Get the current number of files
   */
  public getFileCount(): number {
    return this.files.length;
  }

  /**
   * Check if file count limit is reached
   */
  public isFileLimitReached(): boolean {
    return this.files.length >= this.maxFileCount;
  }
}
