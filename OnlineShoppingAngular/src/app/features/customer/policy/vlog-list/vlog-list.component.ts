import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core"
import { VlogFileDTO, VlogDTO } from "@app/core/models/vlog"


@Component({
  selector: "app-vlog-list",
  standalone: false, // Reverted to false
  templateUrl: "./vlog-list.component.html",
  styleUrls: ["./vlog-list.component.css"],
})
export class VlogListComponent implements OnChanges {
  @Input() vlogs: VlogFileDTO[] = []
  @Input() currentVlogId?: number
  @Input() parentVlogs: VlogDTO[] = []
  @Output() vlogSelected = new EventEmitter<VlogFileDTO>()
  slideIndexes: { [vlogId: number]: number } = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["vlogs"]) {
      console.log("VlogListComponent vlogs:", this.vlogs)
    }
    if (changes["parentVlogs"]) {
      console.log("VlogListComponent parentVlogs:", this.parentVlogs)
    }
    // Debug for matching
    if (this.vlogs && this.parentVlogs) {
      this.vlogs.forEach(v => {
        const match = this.getParentVlog(v.id) || this.getParentVlog((v as any).vlogId);
        console.log('vlog.id:', v.id, 'vlog.vlogId:', (v as any).vlogId, 'matched parent:', match);
      });
    }
  }

  selectVlog(vlog: VlogFileDTO): void {
    this.vlogSelected.emit(vlog)
  }

  isImage(fileType: string | undefined): boolean {
    if (!fileType) return false
    const lowerCaseType = fileType.toLowerCase()
    return (
      lowerCaseType.includes("image") ||
      lowerCaseType.includes("png") ||
      lowerCaseType.includes("jpg") ||
      lowerCaseType.includes("jpeg") ||
      lowerCaseType.includes("gif")
    )
  }

  isVideo(fileType: string | undefined): boolean {
    if (!fileType) return false
    const lowerCaseType = fileType.toLowerCase()
    return (
      lowerCaseType.includes("video") ||
      lowerCaseType.includes("mp4") ||
      lowerCaseType.includes("mov") ||
      lowerCaseType.includes("avi")
    )
  }

  getThumbnailPlaceholder(vlog: VlogFileDTO): string {
    if (this.isVideo(vlog.fileType)) {
      return `/placeholder.svg?height=180&width=320&query=video+thumbnail+placeholder`
    }
    return `/placeholder.svg?height=180&width=320&query=no+thumbnail+available`
  }

  getParentVlog(id: number | undefined): VlogDTO | undefined {
    if (id === undefined || id === null) return undefined;
    // Try both id and vlogId for matching
    return this.parentVlogs.find(parent => parent.id === id || (parent as any).vlogId === id);
  }

  getFilesForVlog(vlogId: number): VlogFileDTO[] {
    return this.vlogs.filter(f => f.vlogId === vlogId);
  }

  nextSlide(vlogId: number, files: VlogFileDTO[]): void {
    if (!this.slideIndexes[vlogId]) this.slideIndexes[vlogId] = 0;
    this.slideIndexes[vlogId] = (this.slideIndexes[vlogId] + 1) % files.length;
  }

  prevSlide(vlogId: number, files: VlogFileDTO[]): void {
    if (!this.slideIndexes[vlogId]) this.slideIndexes[vlogId] = 0;
    this.slideIndexes[vlogId] = (this.slideIndexes[vlogId] - 1 + files.length) % files.length;
  }

  getCurrentSlideIndex(vlogId: number): number {
    return this.slideIndexes[vlogId] || 0;
  }
}
