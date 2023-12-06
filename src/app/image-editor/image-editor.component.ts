import { Component, OnInit, ViewChild } from '@angular/core';
import Konva from 'konva';

@Component({
  selector: 'app-image-editor',
  standalone: true,
  imports: [],
  templateUrl: './image-editor.component.html',
  styleUrl: './image-editor.component.css',
})
export class ImageEditorComponent implements OnInit {
  @ViewChild('drawContainer') drawContainer: any;

  stage: Konva.Stage | undefined = undefined;
  layer = new Konva.Layer();
  transformer = new Konva.Transformer();

  width = 0;
  height = 0;

  constructor() {}

  ngOnInit(): void {
    this.layer = new Konva.Layer();

    this.width = document.getElementById('drawContainer')!.offsetWidth;
    this.height = document.getElementById('drawContainer')!.offsetHeight;

    console.log('width: ' + this.width + ' height: ' + this.height);

    this.stage = new Konva.Stage({
      container: 'drawContainer',
      width: this.width,
      height: this.height,
    });

    this.transformer = new Konva.Transformer();
    this.layer.add(this.transformer);

    this.stage.add(this.layer);

    this.stage.on('click tap', (e) => {
      if (this.textNode && this.textarea) {
        this.swapBack();
        return;
      }
      if (e.target === this.stage) {
        this.transformer.nodes([]);
        return;
      }

      this.transformer.nodes([e.target]);
    });

    // https://konvajs.org/docs/sandbox/Editable_Text.html
    this.stage.on('dblclick dbltap', (e) => {
      const shape = e.target;
      this.textNode = e.target as any;

      if (shape.getClassName() === 'Text') {
        this.textNode.hide();
        this.transformer.hide();

        this.textarea = document.createElement('textarea');
        document.body.appendChild(this.textarea);

        var stageBox = this.stage!.container().getBoundingClientRect();

        var textPosition = this.textNode.getAbsolutePosition();

        var areaPosition = {
          x: stageBox.left + textPosition.x,
          y: stageBox.top + textPosition.y,
        };

        this.textarea.value = this.textNode.text();
        this.textarea.style.position = 'absolute';
        this.textarea.style.top = areaPosition.y + 'px';
        this.textarea.style.left = areaPosition.x + 'px';
        this.textarea.style.width = this.textNode.width();

        this.textarea.focus();

        this.textarea.addEventListener('keydown', (e: any) => {
          if (e.keyCode === 13) {
            this.swapBack();
          }
        });

        setTimeout(() => {});
      }
    });
  }

  textNode: any = undefined;
  textarea: any = undefined;

  handleOutsideClick(e: any) {
    this.swapBack();
  }

  swapBack() {
    this.textNode.text(this.textarea.value);
    this.textNode.show();
    document.body.removeChild(this.textarea);

    this.textNode = undefined;
    this.textarea = undefined;
  }

  addRect() {
    const box = new Konva.Rect({
      x: this.width / 2 - 100,
      y: this.height / 2 - 50,
      width: 200,
      height: 100,

      stroke: 'black',
      strokeWidth: 4,
      draggable: true,
    });

    this.layer.add(box);
    this.transformer.nodes([box]);
  }

  addCircle() {
    const circleNode = new Konva.Circle({
      x: this.width / 2 - 25,
      y: this.height / 2 - 25,
      height: 100,

      stroke: 'black',
      strokeWidth: 4,
      draggable: true,
    });

    this.layer.add(circleNode);
    this.transformer.nodes([circleNode]);
  }

  addText() {
    const tn = new Konva.Text({
      x: this.width / 2 - 100,
      y: this.height / 2 - 25,
      width: 200,
      text: 'Some text here',
      fontSize: 20,
      draggable: true,
    });

    this.layer.add(tn);
    this.transformer.nodes([tn]);
  }
}