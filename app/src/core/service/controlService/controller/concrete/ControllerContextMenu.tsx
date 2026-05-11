import { Vector } from "@graphif/data-structures";
import { ControllerClass } from "../ControllerClass";
import { Settings } from "@/core/service/Settings";
import type { Project } from "@/core/Project";

export class ControllerContextMenuClass extends ControllerClass {
  /** view */
  private mouseDownLocation: Vector = new Vector(0, 0);
  private lastContextMenuLocation: Vector | null = null;
  private lastContextMenuTime = 0;

  constructor(protected readonly project: Project) {
    super(project);
    this.project.canvas.element.addEventListener("contextmenu", this.contextmenu);
  }

  public dispose() {
    super.dispose();
    this.project.canvas.element.removeEventListener("contextmenu", this.contextmenu);
  }

  public mousedown = (event: MouseEvent) => {
    if (event.button !== 2) {
      return; // Only handle right-clicks
    }

    this.mouseDownLocation = new Vector(event.clientX, event.clientY);
  };
  public mouseup = (event: MouseEvent) => {
    if (event.button !== 2) {
      return; // Only handle right-clicks
    }

    const mouseUpLocation = new Vector(event.clientX, event.clientY);
    const distance = this.mouseDownLocation.distance(mouseUpLocation);

    if (distance < 5) {
      this.emitContextMenu(mouseUpLocation);
    }
  };

  private contextmenu = (event: MouseEvent) => {
    event.preventDefault();
    const location = new Vector(event.clientX, event.clientY);
    if (event.ctrlKey && this.project.controller.nodeConnection.shouldIgnoreMacControlContextMenu(location)) {
      return;
    }
    this.emitContextMenu(location);
  };

  private emitContextMenu(location: Vector) {
    if (this.project.controller.nodeConnection.handleRightClickTap(location)) {
      this.lastContextMenuLocation = location.clone();
      this.lastContextMenuTime = Date.now();
      return;
    }

    if (
      this.lastContextMenuLocation &&
      Date.now() - this.lastContextMenuTime < 100 &&
      this.lastContextMenuLocation.distance(location) < 5
    ) {
      return;
    }

    // 检查是否启用了右键点击连线功能并且有实体被选中
    const hasSelectedConnectableEntities = this.project.stageManager
      .getConnectableEntity()
      .some((entity) => entity.isSelected);

    // 转换鼠标位置到世界坐标系
    const worldLocation = this.project.renderer.transformView2World(location);

    // 检查点击位置是否在可连接对象上
    const clickedConnectableEntity = this.project.stageManager.findConnectableEntityByLocation(worldLocation);

    // 如果启用了右键点击连线功能、有实体被选中，并且点击位置在可连接对象上，并且点击的对象未选中，则触发连接，不触发右键菜单
    if (Settings.enableRightClickConnect && hasSelectedConnectableEntities && clickedConnectableEntity !== null) {
      if (!clickedConnectableEntity.isSelected) {
        return;
      }
    }

    this.lastContextMenuLocation = location.clone();
    this.lastContextMenuTime = Date.now();
    this.project.emit("contextmenu", location);
  }
}
