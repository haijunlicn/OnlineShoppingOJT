import { Component, Input, Output, EventEmitter, ViewChild, type ElementRef, forwardRef } from "@angular/core"
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms"

@Component({
  selector: "app-rich-text-editor",
  standalone: false,
  templateUrl: "./rich-text-editor.component.html",
  styleUrls: ["./rich-text-editor.component.css"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
})
export class RichTextEditorComponent implements ControlValueAccessor {
  @ViewChild("editor", { static: true }) editor!: ElementRef
  @ViewChild("fileInput", { static: true }) fileInput!: ElementRef
  @Input() placeholder = "Enter text here..."
  @Output() contentChange = new EventEmitter<string>()
   @Input() content: string = '';


  onEditorContentChange(newContent: string): void {
    this.content = newContent;
    this.contentChange.emit(newContent);
  }

  isFullScreen = false
  showColorPicker = false
  showBgColorPicker = false
  showLinkDialog = false
  linkUrl = ""
  linkText = ""

  fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72]
  fontFamilies = [
    { name: "Arial", value: "Arial, sans-serif" },
    { name: "Times New Roman", value: "Times New Roman, serif" },
    { name: "Courier New", value: "Courier New, monospace" },
    { name: "Helvetica", value: "Helvetica, sans-serif" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Verdana", value: "Verdana, sans-serif" },
    { name: "Comic Sans MS", value: "Comic Sans MS, cursive" },
    { name: "Impact", value: "Impact, sans-serif" },
  ]

  colors = [
    "#000000",
    "#333333",
    "#666666",
    "#999999",
    "#CCCCCC",
    "#FFFFFF",
    "#FF0000",
    "#FF6600",
    "#FFCC00",
    "#FFFF00",
    "#CCFF00",
    "#66FF00",
    "#00FF00",
    "#00FF66",
    "#00FFCC",
    "#00FFFF",
    "#00CCFF",
    "#0066FF",
    "#0000FF",
    "#6600FF",
    "#CC00FF",
    "#FF00FF",
    "#FF00CC",
    "#FF0066",
    "#800000",
    "#804000",
    "#808000",
    "#408000",
    "#008000",
    "#008040",
    "#008080",
    "#004080",
    "#000080",
    "#400080",
    "#800080",
    "#800040",
  ]

  private onChange = (value: string) => {}
  private onTouched = () => {}

  ngOnInit() {
    this.editor.nativeElement.innerHTML = ""
  }

  // Basic formatting commands
  formatText(command: string, value?: string) {
    document.execCommand(command, false, value)
    this.editor.nativeElement.focus()
    this.updateContent()
  }

  // Font size - Fixed event handling
  onFontSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement
    this.changeFontSize(Number.parseInt(target.value))
  }

  changeFontSize(size: number) {
    this.formatText("fontSize", size.toString())
  }

  // Font family - Fixed event handling
  onFontFamilyChange(event: Event) {
    const target = event.target as HTMLSelectElement
    this.changeFontFamily(target.value)
  }

  changeFontFamily(font: string) {
    this.formatText("fontName", font)
  }

  // Text color
  changeTextColor(color: string) {
    this.formatText("foreColor", color)
    this.showColorPicker = false
  }

  // Background color
  changeBackgroundColor(color: string) {
    this.formatText("backColor", color)
    this.showBgColorPicker = false
  }

  // Text alignment
  alignText(alignment: string) {
    this.formatText(`justify${alignment}`)
  }

  // Lists
  insertBulletList() {
    this.formatText("insertUnorderedList")
  }

  insertNumberList() {
    this.formatText("insertOrderedList")
  }

  // Insert horizontal rule
  insertHorizontalRule() {
    this.formatText("insertHorizontalRule")
  }

  // Insert blockquote
  insertBlockquote() {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const blockquote = document.createElement("blockquote")
      blockquote.style.borderLeft = "4px solid #ccc"
      blockquote.style.paddingLeft = "16px"
      blockquote.style.margin = "16px 0"
      blockquote.style.fontStyle = "italic"

      try {
        range.surroundContents(blockquote)
      } catch (e) {
        blockquote.appendChild(range.extractContents())
        range.insertNode(blockquote)
      }

      selection.removeAllRanges()
      this.updateContent()
    }
  }

  // Insert code block
  insertCodeBlock() {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const code = document.createElement("code")
      code.style.backgroundColor = "#f4f4f4"
      code.style.padding = "2px 4px"
      code.style.borderRadius = "3px"
      code.style.fontFamily = "Courier New, monospace"

      try {
        range.surroundContents(code)
      } catch (e) {
        code.appendChild(range.extractContents())
        range.insertNode(code)
      }

      selection.removeAllRanges()
      this.updateContent()
    }
  }

  // Insert link
  showInsertLink() {
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      this.linkText = selection.toString()
    }
    this.showLinkDialog = true
  }

  insertLink() {
    if (this.linkUrl) {
      if (this.linkText) {
        const linkHtml = `<a href="${this.linkUrl}" target="_blank">${this.linkText}</a>`
        this.formatText("insertHTML", linkHtml)
      } else {
        this.formatText("createLink", this.linkUrl)
      }
    }
    this.closeLinkDialog()
  }

  closeLinkDialog() {
    this.showLinkDialog = false
    this.linkUrl = ""
    this.linkText = ""
  }

  // Insert image
  insertImage() {
    this.fileInput.nativeElement.click()
  }

  onImageSelected(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e: any) => {
        const img = `<img src="${e.target.result}" style="max-width: 100%; height: auto;" alt="Inserted image">`
        this.formatText("insertHTML", img)
      }
      reader.readAsDataURL(file)
    }
  }

  // Insert table
  insertTable() {
    const table = `
      <table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 1</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 2</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 3</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 4</td>
        </tr>
      </table>
    `
    this.formatText("insertHTML", table)
  }

  // Clear formatting
  clearFormatting() {
    this.formatText("removeFormat")
  }

  // Full screen toggle
  toggleFullScreen() {
    this.isFullScreen = !this.isFullScreen
  }

  // Print
  printContent() {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              img { max-width: 100%; height: auto; }
              table { border-collapse: collapse; width: 100%; }
              td, th { border: 1px solid #ddd; padding: 8px; }
            </style>
          </head>
          <body>
            ${this.editor.nativeElement.innerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Handle content changes
  onContentChange() {
    this.updateContent()
  }

  private updateContent() {
    const content = this.editor.nativeElement.innerHTML
    this.onChange(content)
    this.contentChange.emit(content)
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    if (value !== undefined) {
      this.editor.nativeElement.innerHTML = value || ""
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  onBlur() {
    this.onTouched()
  }

  // Check if command is active
  isCommandActive(command: string): boolean {
    return document.queryCommandState(command)
  }

  // Get current font size
  getCurrentFontSize(): string {
    return document.queryCommandValue("fontSize") || "3"
  }

  // Get current font family
  getCurrentFontFamily(): string {
    return document.queryCommandValue("fontName") || "Arial"
  }

  // Get plain text content
  getPlainText(): string {
    return this.editor.nativeElement.innerText
  }

  // Get HTML content
  getHtmlContent(): string {
    return this.editor.nativeElement.innerHTML
  }

  // Word count
  getWordCount(): number {
    const text = this.getPlainText()
    return text.trim() ? text.trim().split(/\s+/).length : 0
  }

  // Character count
  getCharacterCount(): number {
    return this.getPlainText().length
  }

  // Close color pickers when clicking outside
  closeColorPickers() {
    this.showColorPicker = false
    this.showBgColorPicker = false
  }
}
