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
  image: Konva.Image | undefined = undefined;

  backlayer = new Konva.Layer();
  layer = new Konva.Layer();
  transformer = new Konva.Transformer();

  width = 0;
  height = 0;

  centerX = 0;
  centerY = 0;

  textNode: any = undefined;
  textarea: any = undefined;

  defaultFontSize = 20;

  statusMessage = '';

  color: string = '#000000';

  file: any;
  imageUrl: string = 'assets/can.jpg';

  constructor() {}

  ngOnInit(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight - 50;

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    console.log('width: ' + this.width + ' height: ' + this.height);

    this.stage = new Konva.Stage({
      container: 'drawContainer',
      width: this.width,
      height: this.height,
    });

    this.transformer = new Konva.Transformer();
    this.layer.add(this.transformer);

    this.stage.add(this.backlayer);
    this.stage.add(this.layer);

    this.resize();

    this.setDefaultMode();

    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    var container = document.getElementById('drawContainer');
    this.width = document.getElementById('drawContainer')!.offsetWidth;
    this.height = document.getElementById('drawContainer')!.offsetHeight;

    console.log('width: ' + this.width + ' height: ' + this.height);

    const height2 = window.innerHeight;
    const width2 = window.innerWidth;
    console.log('width2: ' + width2 + ' height2: ' + height2);

    this.stage?.height(height2);
    this.stage?.width(width2);

    this.width = width2;
    this.height = height2 - 50;

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    if (container) {
      container.style.height = this.height + 'px';
    }

    this.backlayer.removeChildren();
    Konva.Image.fromURL(this.imageUrl, (image) => {
      this.image = image;
      this.backlayer.add(image);
      this.image.draggable(false);

      if (this.image) {
        if (this.image?.width() > this.image?.height()) {
          const ratio = this.image?.width() / this.image?.height();
          const scaleRatio = this.width / this.image?.width();
          this.image?.scale({ x: scaleRatio, y: scaleRatio });
        } else {
          const ratio = this.image?.width() / this.image?.height();
          const scaleRatio = this.height / this.image?.height();
          this.image?.scale({ x: scaleRatio, y: scaleRatio });
        }
      }
    });
  }

  onFileChanged(event: any) {
    this.file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(this.file);
    reader.onload = () => {
      this.imageUrl = reader.result as string;
      this.backlayer.removeChildren();
      Konva.Image.fromURL(this.imageUrl, (image) => {
        if (this.image) {
          if (this.image?.width() > this.image?.height()) {
            const ratio = this.image?.height() / this.image?.width();
            this.image?.width(this.width);
            this.image?.height(this.width * ratio);
          } else {
            const ratio = this.image?.width() / this.image?.height();
            this.image?.height(this.height);
            this.image?.width(this.height * ratio);
          }
        }
      });
    };
  }

  setDefaultMode(selectedItem?: any) {
    this.stage!.off('click tap');
    this.stage!.off('dblclick dbltap');

    this.stage!.on('click tap', (e) => {
      if (this.textNode && this.textarea) {
        this.swapBack();
        return;
      }
      if (e.target === this.stage) {
        this.transformer.nodes([]);
        return;
      }

      if (e.target != this.image) {
        this.transformer.nodes([e.target]);
      }
    });

    // https://konvajs.org/docs/sandbox/Editable_Text.html
    this.stage!.on('dblclick dbltap', (e) => {
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
      }
    });

    this.statusMessage = 'Add shapes to the image';
    if (selectedItem) {
      this.transformer.nodes([selectedItem]);
    } else {
      this.transformer.nodes([]);
    }
  }

  setAddRectMode() {
    this.statusMessage = 'Click on the image to add a rectangle';
    this.transformer.nodes([]);
    this.stage!.off('click tap');
    this.stage!.off('dblclick dbltap');
    this.stage!.on('click tap', (e) => {
      // if mobile
      if (e.evt.changedTouches.length > 0) {
        this.addRect(
          e.evt.changedTouches[0].pageX,
          e.evt.changedTouches[0].pageY
        );
        return;
      }
      // if desktop
      if (e.evt.button === 0) {
        this.addRect(e.evt.offsetX, e.evt.offsetY);
        return;
      }
      this.addRect(this.centerX, this.centerY);
    });
  }

  setAddCircleMode() {
    this.statusMessage = 'Click on the image to add a circle';
    this.transformer.nodes([]);
    this.stage!.off('click tap');
    this.stage!.off('dblclick dbltap');
    this.stage!.on('click tap', (e) => {
      this.addCircle(e.evt.offsetX, e.evt.offsetY);
    });
  }

  setAddTextMode() {
    this.statusMessage = 'Click on the image to add text';
    this.transformer.nodes([]);
    this.stage!.off('click tap');
    this.stage!.off('dblclick dbltap');
    this.stage!.on('click tap', (e) => {
      this.addText(e.evt.offsetX, e.evt.offsetY);
    });
  }

  setAddLineMode() {
    this.statusMessage = 'Click on the image to add a line';
    this.transformer.nodes([]);
    this.stage!.off('click tap');
    this.stage!.off('dblclick dbltap');
    this.stage!.on('click tap', (e) => {
      this.addLine(e.evt.offsetX, e.evt.offsetY);
    });
  }

  setAddArrowMode() {
    this.statusMessage = 'Click on the image to add an arrow';
    this.transformer.nodes([]);
    this.stage!.off('click tap');
    this.stage!.off('dblclick dbltap');
    this.stage!.on('click tap', (e) => {
      this.addArrow(e.evt.offsetX, e.evt.offsetY);
    });
  }

  setColor(color: string) {
    this.color = color;

    if (this.transformer.nodes().length > 0) {
      const selectedNode = this.transformer.nodes()[0] as any;
      if (selectedNode) {
        if (selectedNode.attrs.name === 'rect') {
          selectedNode.stroke(color);
          this.layer.draw();
        }
        if (selectedNode.attrs.name === 'circle') {
          selectedNode.stroke(color);
          this.layer.draw();
        }
        if (selectedNode.attrs.name === 'line') {
          selectedNode.stroke(color);
          this.layer.draw();
        }
        if (selectedNode.attrs.name === 'text') {
          selectedNode.fill(color);
          this.layer.draw();
        }
        if (selectedNode.attrs.name === 'arrow') {
          selectedNode.stroke(color);
          this.layer.draw();
        }
      }
    }
  }

  handleOutsideClick(e: any) {
    this.swapBack();
  }

  swapBack() {
    this.textNode.text(this.textarea.value);
    this.textNode.fontSize(this.defaultFontSize);
    this.textNode.show();
    document.body.removeChild(this.textarea);

    this.transformer.show();

    const thisTextNode = this.textNode;
    this.textNode = undefined;
    this.textarea = undefined;
  }

  addRect(x: number, y: number) {
    const box = new Konva.Rect({
      x: x,
      y: y,
      width: 200,
      height: 100,

      stroke: this.color,
      strokeWidth: 4,
      draggable: true,
      name: 'rect',
    });

    this.layer.add(box);
    this.transformer.nodes([box]);

    this.setDefaultMode(box);
  }

  addCircle(x: number, y: number) {
    const circleNode = new Konva.Circle({
      x: x,
      y: y,
      height: 100,

      stroke: this.color,
      strokeWidth: 4,
      draggable: true,
      name: 'circle',
    });

    this.layer.add(circleNode);
    this.transformer.nodes([circleNode]);

    this.setDefaultMode(circleNode);
  }

  addText(x: number, y: number) {
    const tn = new Konva.Text({
      x: x,
      y: y,
      width: 200,
      text: 'Edit Me',
      fontSize: this.defaultFontSize,
      draggable: true,
      fill: this.color,
      align: 'center',
      name: 'text',
    });

    this.layer.add(tn);
    this.transformer.nodes([tn]);
    this.setDefaultMode(tn);
  }

  addLine(x: number, y: number) {
    const line = new Konva.Line({
      points: [x - 100, y, x + 100, y],
      stroke: this.color,
      strokeWidth: 4,
      lineCap: 'round',
      lineJoin: 'round',
      draggable: true,
      name: 'line',
    });

    this.layer.add(line);
    this.transformer.nodes([line]);
    this.setDefaultMode(line);
  }

  addArrow(x: number, y: number) {
    var arrow = new Konva.Arrow({
      x: x,
      y: y,
      points: [0, 0, 200, 0],
      pointerLength: 20,
      pointerWidth: 20,
      fill: 'black',
      stroke: 'black',
      strokeWidth: 4,
      draggable: true,
      name: 'arrow',
    });

    this.layer.add(arrow);
    this.transformer.nodes([arrow]);
    this.setDefaultMode(arrow);
  }

  addTempLinePoints(x: number, y: number) {
    const line = this.transformer.nodes()[0] as Konva.Line;
    const points = line.points();
    points.push(x);
    points.push(y);
    line.points(points);
    this.layer.add(line);
  }
}
