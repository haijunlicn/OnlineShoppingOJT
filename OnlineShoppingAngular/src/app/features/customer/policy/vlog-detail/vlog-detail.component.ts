import { Component, type OnInit, type OnChanges, type SimpleChanges, Input } from "@angular/core"
import { CommonModule } from "@angular/common"
import { VlogFileDTO } from "@app/core/models/vlog"
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser"


// Define a simple Product interface for demonstration
interface Product {
  id: number
  name: string
  imageUrl: string
  price: number
  link: string
}

@Component({
  selector: "app-vlog-detail",
  templateUrl: "./vlog-detail.component.html",
  styleUrls: ["./vlog-detail.component.css"],
  standalone: false,
})
export class VlogDetailComponent implements OnInit, OnChanges {
  @Input() vlogFile: VlogFileDTO | null = null // Now receives vlogFile as Input
  @Input() products: Product[] = [] // New: Products related to this vlog
  videoUrl: SafeResourceUrl | null = null
  isLoading = false // Parent handles overall loading
  errorMessage: string | null = null

  // Placeholder for related vlogs (can be fetched by parent or this component)
  relatedVlogs: VlogFileDTO[] = [
    {
      id: 2,
      vlogId: 102,
      fileType: "video",
      filePath: "/placeholder.svg?height=150&width=250",
      title: "Another Great Vlog",
      description: "Explore new places",
      duration: "08:15",
      publishedDate: "July 15, 2025",
    },
    {
      id: 3,
      vlogId: 103,
      fileType: "video",
      filePath: "/placeholder.svg?height=150&width=250",
      title: "Travel Adventures",
      description: "Mountains and valleys",
      duration: "12:00",
      publishedDate: "July 10, 2025",
    },
    {
      id: 4,
      vlogId: 104,
      fileType: "video",
      filePath: "/placeholder.svg?height=150&width=250",
      title: "City Life Vlog",
      description: "Urban exploration",
      duration: "06:45",
      publishedDate: "July 05, 2025",
    },
    {
      id: 5,
      vlogId: 105,
      fileType: "video",
      filePath: "/placeholder.svg?height=150&width=250",
      title: "Food Journey",
      description: "Delicious recipes",
      duration: "09:20",
      publishedDate: "July 01, 2025",
    },
  ]

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    // Initial setup if vlogFile is already available
    this.processVlogFile()
  }

  ngOnChanges(changes: SimpleChanges): void {
    // React to changes in the input vlogFile
    if (changes["vlogFile"] && changes["vlogFile"].currentValue !== changes["vlogFile"].previousValue) {
      this.processVlogFile()
    }
  }

  private processVlogFile(): void {
    this.videoUrl = null
    this.errorMessage = null

    if (this.vlogFile) {
      if (this.vlogFile.fileType?.toLowerCase() === "video" && this.vlogFile.filePath) {
        this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.vlogFile.filePath)
      } else {
        this.errorMessage = "This vlog is not a video or has no valid video path."
      }
    }
  }

  // Placeholder for interaction functions
  likeVlog(): void {
    alert("Liked!")
  }

  shareVlog(): void {
    alert("Shared!")
  }

  commentVlog(): void {
    alert("Commented!")
  }

  subscribeChannel(): void {
    alert("Subscribed!")
  }

  // Placeholder for UGC (User Generated Content)
  customerReviews: { author: string; comment: string; videoUrl?: string }[] = [
    {
      author: "Aung Aung",
      comment: "This camera kit is amazing! My vlogs look so professional now.",
    },
    {
      author: "Su Su",
      comment: "The travel backpack is super comfortable and spacious. Highly recommend!",
      videoUrl: "/placeholder.svg?height=100&width=150",
    },
  ]
}
