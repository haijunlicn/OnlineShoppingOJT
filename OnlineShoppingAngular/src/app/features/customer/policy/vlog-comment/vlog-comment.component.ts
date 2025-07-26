import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { VlogComment, VlogDTO } from '@app/core/models/vlog';
import { VlogCommentService } from '@app/core/services/vlog-comment.service';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-vlog-comment',
  standalone: false,
  templateUrl: './vlog-comment.component.html',
  styleUrl: './vlog-comment.component.css'
})
export class VlogCommentComponent implements OnInit, OnChanges {
  @Input() vlog!: VlogDTO | null;
  @Output() commentPosted = new EventEmitter<VlogComment>();

  comments: VlogComment[] = [];
  isLoadingComments = false;
  commentText = '';
  isPostingComment = false;

  constructor(
    private vlogCommentService: VlogCommentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadComments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vlog']) {
      this.loadComments();
    }
  }

  loadComments(): void {
    if (!this.vlog || !this.vlog.vlogId) {
      this.comments = [];
      this.isLoadingComments = false;
      return;
    }
    this.isLoadingComments = true;
    this.vlogCommentService.getCommentsByVlogId(this.vlog.vlogId).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.isLoadingComments = false;
      },
      error: () => {
        this.comments = [];
        this.isLoadingComments = false;
      },
    });
  }

  postComment(): void {
    console.log('postComment called', this.vlog, this.commentText);
    if (!this.vlog || !this.vlog.vlogId || !this.commentText.trim()) return;
    console.log('Guard clause hit', this.vlog, this.commentText);
    this.isPostingComment = true;
    const currentUser = this.authService.getCurrentUser();
    const newComment: VlogComment = {
      author: currentUser?.name || 'Anonymous',
      text: this.commentText.trim(),
      avatarInitial: currentUser?.name?.charAt(0).toUpperCase() || 'A',
      commentDate: new Date().toISOString(),
      vlogId: this.vlog.vlogId,
      userId: currentUser?.id,
    };
    console.log('Posting comment with:', newComment);
    this.vlogCommentService.createComment(newComment).subscribe({
      next: (createdComment) => {
        this.comments.unshift(createdComment);
        this.commentText = '';
        this.isPostingComment = false;
        this.commentPosted.emit(createdComment);
      },
      error: (error) => {
        console.error('❌ Error posting comment:', error);
        this.isPostingComment = false;
      },
    });
  }
}
