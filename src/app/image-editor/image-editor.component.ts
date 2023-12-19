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

  annotations: any[] = [];

  constructor() {}

  ngOnInit(): void {
    this.drawContainer = document.getElementById('drawContainer');

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
    const height2 = window.innerHeight;
    const width2 = window.innerWidth;
    console.log('width2: ' + width2 + ' height2: ' + height2);

    this.stage?.height(height2 - 50);
    this.stage?.width(width2);

    this.width = width2;
    this.height = height2 - 50;

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    var container = document.getElementById('drawContainer');
    if (container) {
      container.style.height = this.height + 'px';
    }

    this.backlayer.removeChildren();
    Konva.Image.fromURL(this.imageUrl, (image) => {
      this.image = image;
      this.backlayer.add(image);
      this.image.draggable(false);

      if (this.image) {
        const ih1 = this.image?.height();
        const iw1 = this.image?.width();

        let ih2 = this.image?.height();
        let iw2 = this.image?.width();

        if (this.image?.width() > this.image?.height()) {
          const scaleRatio = this.width / this.image?.width();
          ih2 = ih1 * scaleRatio;
          iw2 = iw1 * scaleRatio;
        } else {
          const scaleRatio = this.height / this.image?.height();
          ih2 = ih1 * scaleRatio;
          iw2 = iw1 * scaleRatio;
        }

        if (iw2 > this.width) {
          const scaleRatio = this.width / iw2;
          ih2 = ih2 * scaleRatio;
          iw2 = iw2 * scaleRatio;
        }
        if (ih2 > this.height) {
          const scaleRatio = this.height / ih2;
          ih2 = ih2 * scaleRatio;
          iw2 = iw2 * scaleRatio;
        }

        console.log('ih1: ' + ih1 + ' iw1: ' + iw1);
        console.log('ih2: ' + ih2 + ' iw2: ' + iw2);

        this.image?.height(ih2);
        this.image?.width(iw2);
      }
    });
  }

  clear() {
    while (this.annotations.length > 0) {
      this.undo();
    }
  }

  undo() {
    if (this.annotations.length > 0) {
      const lastAnnotation = this.annotations.pop();
      this.transformer.nodes([]);
      lastAnnotation?.remove();
      this.layer.draw();
      this.setDefaultMode();
    }
  }

  async downloadImage() {
    this.transformer.nodes([]);
    var i = (await this.stage?.toImage()) as any;
    var d = await this.stage?.toDataURL();

    var w = window.open('');
    if (w) {
      w.document.write(i?.outerHTML);
    }
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

  addItem(item: any) {
    this.annotations.push(item);
    this.layer.add(item);
    this.setDefaultMode(item);
  }

  setDefaultMode(selectedItem?: any) {
    this.disableAllModes();

    for (var i = 0; i < this.layer.children.length; i++) {
      this.layer.children[i].draggable(false);
    }

    this.stage!.on('click tap', (e) => {
      if (this.textNode && this.textarea) {
        this.swapBack();
        return;
      }
      if (e.target === this.stage || e.target === this.image) {
        this.transformer.nodes().forEach((node) => {
          node.draggable(false);
        });
        this.transformer.nodes([]);
        return;
      }

      if (e.target != this.image) {
        this.transformer.nodes([e.target]);
        e.target.draggable(true);
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
      selectedItem.draggable(true);
    } else {
      this.transformer.nodes([]);
    }
  }

  disableAllModes() {
    this.transformer.nodes([]);
    this.stage!.off('click tap');
    this.stage!.off('dblclick dbltap');
    this.stage!.off('touchstart mousedown');
    this.stage!.off('touchend mouseup');
  }

  setAddRectMode() {
    this.statusMessage = 'Click on the image to add a rectangle';
    this.disableAllModes();

    this.stage!.on('click tap', (e) => {
      const pos = this.stage!.getPointerPosition();
      if (pos && pos.x && pos.y) {
        this.addRect(pos.x, pos.y);
      } else {
        this.addRect(this.centerX, this.centerY);
      }
    });
  }

  addRect(x: number, y: number) {
    const box = new Konva.Rect({
      x: x - 100,
      y: this.offsetY(y) - 50,
      width: 200,
      height: 100,

      stroke: this.color,
      strokeWidth: 4,
      draggable: true,
      name: 'rect',
    });

    this.addItem(box);
  }

  setAddCircleMode() {
    this.statusMessage = 'Click on the image to add a circle';
    this.disableAllModes();

    this.stage!.on('click tap', (e) => {
      const pos = this.stage!.getPointerPosition();
      if (pos && pos.x && pos.y) {
        this.addCircle(pos.x, pos.y);
      } else {
        this.addCircle(this.centerX, this.centerY);
      }
    });
  }

  addCircle(x: number, y: number) {
    const circleNode = new Konva.Circle({
      x: x,
      y: this.offsetY(y),
      height: 100,

      stroke: this.color,
      strokeWidth: 4,
      draggable: true,
      name: 'circle',
    });

    this.addItem(circleNode);
  }

  setAddTextMode() {
    this.statusMessage = 'Click on the image to add text';
    this.disableAllModes();

    this.stage!.on('click tap', (e) => {
      const pos = this.stage!.getPointerPosition();
      if (pos && pos.x && pos.y) {
        this.addText(pos.x, pos.y);
      } else {
        this.addText(this.centerX, this.centerY);
      }
    });
  }

  addText(x: number, y: number) {
    const tn = new Konva.Text({
      x: x - 100,
      y: this.offsetY(y),
      width: 200,
      text: 'Edit Me',
      fontSize: this.defaultFontSize,
      draggable: true,
      fill: this.color,
      align: 'center',
      name: 'text',
    });

    this.addItem(tn);
  }

  setAddLineMode() {
    this.statusMessage = 'Click on the image to add a line';
    this.disableAllModes();

    this.stage!.on('touchstart mousedown', (e) => {
      const pos = this.stage!.getPointerPosition();
      this.firstPoint.x = pos!.x;
      this.firstPoint.y = pos!.y;
    });
    this.stage!.on('touchend mouseup', (e) => {
      const pos = this.stage!.getPointerPosition();
      this.addLine(this.firstPoint.x, this.firstPoint.y, pos?.x, pos?.y);
    });
  }

  addLine(startX: number, startY: number, endX?: number, endY?: number) {
    let line = new Konva.Line({
      points: [
        startX - 100,
        this.offsetY(startY),
        startX + 100,
        this.offsetY(startY),
      ],
      stroke: this.color,
      strokeWidth: 4,
      lineCap: 'round',
      lineJoin: 'round',
      draggable: true,
      name: 'line',
    });
    if (
      endX != undefined &&
      endY != undefined &&
      Math.abs(endX! - startX) +
        Math.abs(this.offsetY(endY)! - this.offsetY(startY)) >=
        100
    ) {
      line = new Konva.Line({
        points: [startX, this.offsetY(startY), endX, this.offsetY(endY)],
        stroke: this.color,
        strokeWidth: 4,
        lineCap: 'round',
        lineJoin: 'round',
        draggable: true,
        name: 'line',
      });
    }

    this.addItem(line);
  }

  firstPoint = { x: 0, y: 0 };

  setAddArrowMode() {
    this.statusMessage = 'Click on the image to add an arrow';
    this.disableAllModes();

    this.stage!.on('touchstart mousedown', (e) => {
      const pos = this.stage!.getPointerPosition();
      this.firstPoint.x = pos!.x;
      this.firstPoint.y = pos!.y;
    });
    this.stage!.on('touchend mouseup', (e) => {
      const pos = this.stage!.getPointerPosition();
      this.addArrow(this.firstPoint.x, this.firstPoint.y, pos?.x, pos?.y);
    });
  }

  addArrow(startX: number, startY: number, endX?: number, endY?: number) {
    var arrow = new Konva.Arrow({
      points: [startX - 100, startY, startX + 100, startY],
      pointerLength: 20,
      pointerWidth: 20,
      fill: this.color,
      stroke: this.color,
      strokeWidth: 4,
      draggable: true,
      name: 'arrow',
    });

    if (
      endX != undefined &&
      endY != undefined &&
      Math.abs(endX! - startX) + Math.abs(endY - startY) >= 100
    ) {
      arrow = new Konva.Arrow({
        points: [startX, startY, endX, endY],
        stroke: this.color,
        strokeWidth: 4,
        pointerLength: 20,
        pointerWidth: 20,
        draggable: true,
        strokeHitEnabled: true,
        name: 'arrow',
      });
    }

    this.addItem(arrow);
  }

  isPaint = false;
  brushLine: Konva.Line | undefined = undefined;

  // https://konvajs.org/docs/sandbox/Free_Drawing.html
  setPaintBrushMode() {
    this.statusMessage = 'Click/drag to draw on the image';
    this.disableAllModes();

    this.stage!.on('touchstart mousedown', (e) => {
      this.isPaint = true;
      var pos = this.stage!.getPointerPosition();
      this.brushLine = new Konva.Line({
        stroke: this.color,
        strokeWidth: 5,
        globalCompositeOperation: 'source-over',
        lineCap: 'round',
        lineJoin: 'round',
        points: [pos!.x, pos!.y, pos!.x, pos!.y],
        name: 'brush',
      });
      this.layer.add(this.brushLine);
      this.annotations.push(this.brushLine);
    });
    this.stage!.on('touchend mouseup', (e) => {
      this.isPaint = false;
      this.setDefaultMode(this.brushLine);
    });
    this.stage!.on('mousemove touchmove', (e) => {
      if (!this.isPaint) {
        return;
      }

      // prevent scrolling on touch devices
      e.evt.preventDefault();

      const pos = this.stage!.getPointerPosition();
      var newPoints = this.brushLine!.points().concat([pos!.x, pos!.y]);
      this.brushLine!.points(newPoints);
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
        if (selectedNode.attrs.name === 'brush') {
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

  offsetY(y: number) {
    return y;
  }
}
