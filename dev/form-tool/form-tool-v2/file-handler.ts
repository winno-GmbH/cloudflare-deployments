export class FileHandler {
  private files: File[] = [];
  private input: HTMLInputElement;
  private onFilesChanged: (files: FileList) => void;
  private allowedTypes: string[] = [];

  constructor(input: HTMLInputElement, onFilesChanged: (files: FileList) => void) {
    this.input = input;
    this.onFilesChanged = onFilesChanged;
    this.allowedTypes = input.getAttribute('accept')?.split(',') || [];

    // Initialize with any existing files
    if (input.files && input.files.length > 0) {
      this.addFiles(input.files);
    }
  }

  /**
   * Add files to the handler's file collection
   */
  public addFiles(newFiles: FileList | File[]): boolean {
    if (!newFiles || newFiles.length === 0) return false;

    // Check file types if restrictions exist
    let hasError = false;

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (this.allowedTypes.length > 0 &&
        !this.allowedTypes.some(type => file.type.match(type.replace('*', '.*')))) {
        hasError = true;
        break;
      }
    }

    if (hasError) {
      return false;
    }

    // Add the new files to our collection
    Array.from(newFiles).forEach(file => {
      this.files.push(file);
    });

    // Update the input element
    this.updateInputFiles();

    // Notify listener about the change
    this.onFilesChanged(this.getFilesAsList());

    return true;
  }

  /**
   * Remove a file by its index
   */
  public removeFile(index: number): void {
    if (index >= 0 && index < this.files.length) {
      this.files.splice(index, 1);
      this.updateInputFiles();
      this.onFilesChanged(this.getFilesAsList());
    }
  }

  /**
   * Clear all files
   */
  public clearFiles(): void {
    this.files = [];
    this.updateInputFiles();
    this.onFilesChanged(new DataTransfer().files);
  }

  /**
   * Get all files as a FileList object
   */
  public getFilesAsList(): FileList {
    const dataTransfer = new DataTransfer();
    this.files.forEach(file => {
      dataTransfer.items.add(file);
    });
    return dataTransfer.files;
  }

  /**
   * Update the actual input element with our files
   */
  private updateInputFiles(): void {
    const dataTransfer = new DataTransfer();
    this.files.forEach(file => {
      dataTransfer.items.add(file);
    });
    this.input.files = dataTransfer.files;
  }
} 