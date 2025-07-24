import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core"
import { VlogFileDTO } from "@app/core/models/vlog"


@Component({
  selector: "app-vlog-list",
  templateUrl: "./vlog-list.component.html",
  styleUrls: ["./vlog-list.component.css"],
  standalone: false,
})
export class VlogListComponent implements OnInit {
  @Input() vlogs: VlogFileDTO[] = []
  @Input() selectedVlogId: number | undefined // To highlight the selected vlog
  @Output() vlogSelected = new EventEmitter<VlogFileDTO>()

  constructor() {}

  ngOnInit(): void {
    // No initial data fetching here, parent passes data
  }

  selectVlog(vlog: VlogFileDTO): void {
    this.vlogSelected.emit(vlog)
  }

  getThumbnailUrl(file: VlogFileDTO): string {
    if (file.fileType?.toLowerCase() === "image") {
      return file.filePath
    }
    // For videos, you'd typically have a separate thumbnail URL or generate one.
    // For now, using a generic placeholder or the video path itself if it can serve as a poster.
    return file.filePath || "/placeholder.svg?height=200&width=300"
  }
}
