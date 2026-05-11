import { Project, service } from "@/core/Project";
import { EntityShrinkEffect } from "@/core/service/feedbackService/effectEngine/concrete/EntityShrinkEffect";
import { PenStrokeDeletedEffect } from "@/core/service/feedbackService/effectEngine/concrete/PenStrokeDeletedEffect";
import { SoundService } from "@/core/service/feedbackService/SoundService";
import { Settings } from "@/core/service/Settings";
import { Association } from "@/core/stage/stageObject/abstract/Association";
import { ConnectableEntity } from "@/core/stage/stageObject/abstract/ConnectableEntity";
import { Entity } from "@/core/stage/stageObject/abstract/StageEntity";
import { StageObject } from "@/core/stage/stageObject/abstract/StageObject";
import { CubicCatmullRomSplineEdge } from "@/core/stage/stageObject/association/CubicCatmullRomSplineEdge";
import { Edge } from "@/core/stage/stageObject/association/Edge";
import { LineEdge } from "@/core/stage/stageObject/association/LineEdge";
import { MultiTargetUndirectedEdge } from "@/core/stage/stageObject/association/MutiTargetUndirectedEdge";
import { ConnectPoint } from "@/core/stage/stageObject/entity/ConnectPoint";
import { ImageNode } from "@/core/stage/stageObject/entity/ImageNode";
import { LatexNode } from "@/core/stage/stageObject/entity/LatexNode";
import { PenStroke } from "@/core/stage/stageObject/entity/PenStroke";
import { Section } from "@/core/stage/stageObject/entity/Section";
import { SvgNode } from "@/core/stage/stageObject/entity/SvgNode";
import { TextNode } from "@/core/stage/stageObject/entity/TextNode";
import { UrlNode } from "@/core/stage/stageObject/entity/UrlNode";
import { Direction } from "@/types/directions";
// import { Serialized } from "@/types/node";
import { Vector } from "@graphif/data-structures";
import { Rectangle } from "@graphif/shapes";
import { toast } from "sonner";

// littlefean:应该改成类，实例化的对象绑定到舞台上。这成单例模式了
// 开发过程中会造成多开
// zty012:这个是存储数据的，和舞台无关，应该单独抽离出来
// 并且会在舞台之外的地方操作，所以应该是namespace单例

/**
 * 子场景的相机数据
 */
export type ChildCameraData = {
  /**
   * 传送门的左上角位置
   */
  location: Vector;
  zoom: number;
  /**
   * 传送门大小
   */
  size: Vector;
  /**
   * 相机的目标位置
   */
  targetLocation: Vector;
};

/**
 * 舞台管理器，也可以看成包含了很多操作方法的《舞台实体容器》
 * 管理节点、边的关系等，内部包含了舞台上的所有实体
 */
@service("stageManager")
export class StageManager {
  constructor(private readonly project: Project) {}

  private indexedStage: StageObject[] | null = null;
  private indexedStageLength = -1;
  private indexRevision = 0;
  private uuidIndex = new Map<string, StageObject>();
  private textNodes: TextNode[] = [];
  private connectableEntities: ConnectableEntity[] = [];
  private sections: Section[] = [];
  private imageNodes: ImageNode[] = [];
  private connectPoints: ConnectPoint[] = [];
  private urlNodes: UrlNode[] = [];
  private penStrokes: PenStroke[] = [];
  private svgNodes: SvgNode[] = [];
  private latexNodes: LatexNode[] = [];
  private entities: Entity[] = [];
  private associations: Association[] = [];
  private edges: Edge[] = [];
  private lineEdges: LineEdge[] = [];
  private crEdges: CubicCatmullRomSplineEdge[] = [];

  get revision(): number {
    this.ensureIndex();
    return this.indexRevision;
  }

  private invalidateIndex() {
    this.indexedStage = null;
    this.indexedStageLength = -1;
    this.indexRevision++;
  }

  private ensureIndex() {
    if (this.indexedStage === this.project.stage && this.indexedStageLength === this.project.stage.length) {
      return;
    }

    this.indexedStage = this.project.stage;
    this.indexedStageLength = this.project.stage.length;
    this.indexRevision++;
    this.uuidIndex = new Map();
    this.textNodes = [];
    this.connectableEntities = [];
    this.sections = [];
    this.imageNodes = [];
    this.connectPoints = [];
    this.urlNodes = [];
    this.penStrokes = [];
    this.svgNodes = [];
    this.latexNodes = [];
    this.entities = [];
    this.associations = [];
    this.edges = [];
    this.lineEdges = [];
    this.crEdges = [];

    for (const node of this.project.stage) {
      this.uuidIndex.set(node.uuid, node);
      if (node instanceof TextNode) this.textNodes.push(node);
      if (node instanceof ImageNode) this.imageNodes.push(node);
      if (node instanceof ConnectPoint) this.connectPoints.push(node);
      if (node instanceof UrlNode) this.urlNodes.push(node);
      if (node instanceof PenStroke) this.penStrokes.push(node);
      if (node instanceof SvgNode) this.svgNodes.push(node);
      if (node instanceof LatexNode) this.latexNodes.push(node);
      if (node instanceof Section) this.sections.push(node);
      if (node instanceof Entity) this.entities.push(node);
      if (node instanceof Association) this.associations.push(node);
      if (node instanceof Edge) this.edges.push(node);
      if (node instanceof LineEdge) this.lineEdges.push(node);
      if (node instanceof CubicCatmullRomSplineEdge) this.crEdges.push(node);
      if (node instanceof ConnectableEntity && !(node instanceof ImageNode && node.isBackground)) {
        this.connectableEntities.push(node);
      }
    }
  }

  get(uuid: string) {
    this.ensureIndex();
    return this.uuidIndex.get(uuid);
  }

  isEmpty(): boolean {
    return this.project.stage.length === 0;
  }
  getTextNodes(): TextNode[] {
    this.ensureIndex();
    return this.textNodes;
  }
  getConnectableEntity(): ConnectableEntity[] {
    this.ensureIndex();
    return this.connectableEntities;
  }
  isEntityExists(uuid: string): boolean {
    this.ensureIndex();
    return this.uuidIndex.has(uuid);
  }
  getSections(): Section[] {
    this.ensureIndex();
    return this.sections;
  }
  getImageNodes(): ImageNode[] {
    this.ensureIndex();
    return this.imageNodes;
  }
  getConnectPoints(): ConnectPoint[] {
    this.ensureIndex();
    return this.connectPoints;
  }
  getUrlNodes(): UrlNode[] {
    this.ensureIndex();
    return this.urlNodes;
  }
  // getPortalNodes(): PortalNode[] {
  //   return this.project.stage.filter((node) => node instanceof PortalNode);
  // }
  getPenStrokes(): PenStroke[] {
    this.ensureIndex();
    return this.penStrokes;
  }
  getSvgNodes(): SvgNode[] {
    this.ensureIndex();
    return this.svgNodes;
  }
  getLatexNodes(): LatexNode[] {
    this.ensureIndex();
    return this.latexNodes;
  }

  getStageObjects(): StageObject[] {
    return this.project.stage;
  }

  /**
   * 获取场上所有的实体
   * @returns
   */
  getEntities(): Entity[] {
    this.ensureIndex();
    return this.entities;
  }
  getEntitiesByUUIDs(uuids: string[]): Entity[] {
    this.ensureIndex();
    const uuidSet = new Set(uuids);
    return this.entities.filter((node) => uuidSet.has(node.uuid));
  }
  isNoEntity(): boolean {
    this.ensureIndex();
    return this.entities.length === 0;
  }
  delete(stageObject: StageObject) {
    const index = this.project.stage.indexOf(stageObject);
    if (index === -1) return;
    this.project.stage.splice(index, 1);
    this.invalidateIndex();
    this.project.markContentChanged();
  }

  getAssociations(): Association[] {
    this.ensureIndex();
    return this.associations;
  }
  getEdges(): Edge[] {
    this.ensureIndex();
    return this.edges;
  }
  getLineEdges(): LineEdge[] {
    this.ensureIndex();
    return this.lineEdges;
  }
  getCrEdges(): CubicCatmullRomSplineEdge[] {
    this.ensureIndex();
    return this.crEdges;
  }

  add(stageObject: StageObject) {
    this.project.stage.push(stageObject);
    this.invalidateIndex();
    this.project.markContentChanged();
  }

  /**
   * 更新节点的引用，将unknown的节点替换为真实的节点，保证对象在内存中的唯一性
   * 节点什么情况下会是unknown的？
   *
   * 包含了对分组框的更新
   * 包含了对Edge几何组偏移索引的更新（多重边/双向边自动散开）
   */
  updateReferences() {
    this.ensureIndex();
    for (const entity of this.getEntities()) {
      // 实体是可连接类型
      if (entity instanceof ConnectableEntity) {
        for (const edge of this.getAssociations()) {
          if (edge instanceof Edge) {
            if (edge.source.unknown && edge.source.uuid === entity.uuid) {
              edge.source = entity;
            }
            if (edge.target.unknown && edge.target.uuid === entity.uuid) {
              edge.target = entity;
            }
          }
        }
      }
    }
    // 以下是分组框的更新，y值降序排序，从下往上排序，因为下面的往往是内层的Section
    for (const section of this.getSections().sort(
      (a, b) => b.collisionBox.getRectangle().location.y - a.collisionBox.getRectangle().location.y,
    )) {
      // 更新孩子数组，并调整位置和大小
      const newChildList = [];

      for (const child of section.children) {
        const childObject = this.get(child.uuid);
        if (childObject instanceof Entity) {
          if (childObject) {
            newChildList.push(childObject);
          }
        }
      }
      section.children = newChildList;
      section.adjustLocationAndSize();
      section.adjustChildrenStateByCollapse();
    }

    // 以下是LineEdge几何组偏移索引的更新
    // 几何组 key：无向，(minNodeId, maxNodeId, epAtMin, epAtMax)
    // A→B 和 B→A 端点位置相同时归入同一几何组，统一分配 shiftingIndex
    const rateKey = (v: Vector): string => `${v.x.toFixed(2)},${v.y.toFixed(2)}`;
    const geoGroups = new Map<string, LineEdge[]>();

    for (const edge of this.getLineEdges()) {
      if (edge.source.uuid === edge.target.uuid) {
        // 自环跳过，不参与几何组，shiftingIndex 保持 0
        edge.shiftingIndex = 0;
        continue;
      }
      const idA = edge.source.uuid;
      const idB = edge.target.uuid;
      let key: string;
      if (idA <= idB) {
        key = `${idA}|${idB}|${rateKey(edge.sourceRectangleRate)}|${rateKey(edge.targetRectangleRate)}`;
      } else {
        // B→A 方向：交换端点对应关系，使 A→B 与 B→A 落入同一几何组
        key = `${idB}|${idA}|${rateKey(edge.targetRectangleRate)}|${rateKey(edge.sourceRectangleRate)}`;
      }
      if (!geoGroups.has(key)) geoGroups.set(key, []);
      geoGroups.get(key)!.push(edge);
    }

    for (const [, edges] of geoGroups) {
      // 按 uuid 字典序稳定排序，避免重渲染时 index 跳变
      edges.sort((a, b) => a.uuid.localeCompare(b.uuid));
      const count = edges.length;
      // 对称分配 shiftingIndex：
      // count=1 → [0]
      // count=2 → [-1, 1]（跳过0，两条都弯，视觉对称）
      // count=3 → [-1, 0, 1]
      // count=4 → [-2, -1, 1, 2]
      // count=5 → [-2, -1, 0, 1, 2]
      for (let i = 0; i < count; i++) {
        let idx: number;
        if (count === 1) {
          idx = 0;
        } else if (count % 2 === 0) {
          const half = count / 2;
          idx = i < half ? i - half : i - half + 1;
        } else {
          idx = i - Math.floor(count / 2);
        }
        edges[i].shiftingIndex = idx;
      }
    }
    this.invalidateIndex();
  }

  getTextNodeByUUID(uuid: string): TextNode | null {
    for (const node of this.getTextNodes()) {
      if (node.uuid === uuid) {
        return node;
      }
    }
    return null;
  }
  getConnectableEntityByUUID(uuid: string): ConnectableEntity | null {
    for (const node of this.getConnectableEntity()) {
      if (node.uuid === uuid) {
        return node;
      }
    }
    return null;
  }
  isSectionByUUID(uuid: string): boolean {
    return this.project.stage.find((node) => node.uuid === uuid) instanceof Section;
  }
  getSectionByUUID(uuid: string): Section | null {
    const entity = this.get(uuid);
    if (entity instanceof Section) {
      return entity;
    }
    return null;
  }

  /**
   * 计算所有节点的中心点
   */
  getCenter(): Vector {
    if (this.project.stage.length === 0) {
      return Vector.getZero();
    }
    const physicalObjects = this.project.stage.filter((node) => node.isPhysical);
    if (physicalObjects.length === 0) {
      return Vector.getZero();
    }
    const allNodesRectangle = Rectangle.getBoundingRectangle(
      physicalObjects.map((node) => node.collisionBox.getRectangle()),
    );
    return allNodesRectangle.center;
  }

  /**
   * 计算所有节点的大小
   */
  getSize(): Vector {
    if (this.project.stage.length === 0) {
      return new Vector(this.project.renderer.w, this.project.renderer.h);
    }
    const size = this.getBoundingRectangle().size;

    return size;
  }

  /**
   * 获取舞台的矩形对象
   */
  getBoundingRectangle(): Rectangle {
    const physicalObjects = Array.from(this.project.stage).filter((node) => node.isPhysical);
    if (physicalObjects.length === 0) {
      return new Rectangle(Vector.getZero(), Vector.getZero());
    }
    const rect = Rectangle.getBoundingRectangle(physicalObjects.map((node) => node.collisionBox.getRectangle()));

    return rect;
  }

  /**
   * 根据位置查找节点，常用于点击事件
   * @param location
   * @returns
   */
  findTextNodeByLocation(location: Vector): TextNode | null {
    for (const node of this.getTextNodes()) {
      if (node.collisionBox.isContainsPoint(location)) {
        return node;
      }
    }
    return null;
  }

  /**
   * 用于鼠标悬停时查找边
   * @param location
   * @returns
   */
  findLineEdgeByLocation(location: Vector): LineEdge | null {
    for (const edge of this.getLineEdges()) {
      if (edge.collisionBox.isContainsPoint(location)) {
        return edge;
      }
    }
    return null;
  }

  findAssociationByLocation(location: Vector): Association | null {
    for (const association of this.getAssociations()) {
      if (association.collisionBox.isContainsPoint(location)) {
        return association;
      }
    }
    return null;
  }

  findSectionByLocation(location: Vector): Section | null {
    for (const section of this.getSections()) {
      if (section.collisionBox.isContainsPoint(location)) {
        return section;
      }
    }
    return null;
  }

  findImageNodeByLocation(location: Vector): ImageNode | null {
    for (const node of this.getImageNodes()) {
      if (!node.isBackground && node.collisionBox.isContainsPoint(location)) {
        return node;
      }
    }
    return null;
  }

  findConnectableEntityByLocation(location: Vector): ConnectableEntity | null {
    for (const entity of this.getConnectableEntity()) {
      if (entity.isHiddenBySectionCollapse) {
        continue;
      }
      if (entity.collisionBox.isContainsPoint(location)) {
        return entity;
      }
    }
    return null;
  }

  /**
   * 优先级：
   * 涂鸦 > 其他
   * @param location
   * @returns
   */
  findEntityByLocation(location: Vector): Entity | null {
    for (const penStroke of this.getPenStrokes()) {
      if (penStroke.isHiddenBySectionCollapse) continue;
      if (penStroke.collisionBox.isContainsPoint(location)) {
        return penStroke;
      }
    }
    for (const entity of this.getEntities()) {
      if (entity.isHiddenBySectionCollapse) {
        continue;
      }
      if (entity instanceof ImageNode && entity.isBackground) {
        continue;
      }
      if (entity.collisionBox.isContainsPoint(location)) {
        return entity;
      }
    }
    return null;
  }

  findConnectPointByLocation(location: Vector): ConnectPoint | null {
    for (const point of this.getConnectPoints()) {
      if (point.isHiddenBySectionCollapse) {
        continue;
      }
      if (point.collisionBox.isContainsPoint(location)) {
        return point;
      }
    }
    return null;
  }
  isHaveEntitySelected(): boolean {
    for (const entity of this.getEntities()) {
      if (entity.isSelected) {
        return true;
      }
    }
    return false;
  }

  /**
   * O(n)
   * @returns
   */
  getSelectedEntities(): Entity[] {
    return this.project.stage.filter(
      (so) => so.isSelected && so instanceof Entity && !(so instanceof ImageNode && (so as ImageNode).isBackground),
    ) as Entity[];
  }
  getSelectedAssociations(): Association[] {
    return this.project.stage.filter((so) => so.isSelected && so instanceof Association) as Association[];
  }
  getSelectedStageObjects(): StageObject[] {
    const result: StageObject[] = [];
    result.push(...this.getSelectedEntities());
    result.push(...this.getSelectedAssociations());
    return result;
  }

  /**
   * 获取选中内容的边界矩形
   * @returns
   */
  getBoundingBoxOfSelected(): Rectangle {
    const selectedObjects = this.getSelectedStageObjects();
    if (selectedObjects.length === 0) {
      // 如果没有选中任何对象，返回一个默认的矩形
      return new Rectangle(Vector.getZero(), new Vector(100, 100));
    }

    const rectangles = selectedObjects.map((obj) => obj.collisionBox.getRectangle());
    return Rectangle.getBoundingRectangle(rectangles);
  }

  /**
   * 判断某一点是否有实体存在（排除实体的被Section折叠）
   * @param location
   * @returns
   */
  isEntityOnLocation(location: Vector): boolean {
    for (const entity of this.getEntities()) {
      if (entity.isHiddenBySectionCollapse) {
        continue;
      }
      if (entity instanceof ImageNode && entity.isBackground) {
        continue;
      }
      if (entity.collisionBox.isContainsPoint(location)) {
        return true;
      }
    }
    return false;
  }
  isAssociationOnLocation(location: Vector): boolean {
    for (const association of this.getAssociations()) {
      if (association instanceof Edge) {
        if (association.target.isHiddenBySectionCollapse && association.source.isHiddenBySectionCollapse) {
          continue;
        }
      }
      if (association.collisionBox.isContainsPoint(location)) {
        return true;
      }
    }
    return false;
  }

  // region 以下为舞台操作相关的函数
  // 建议不同的功能分类到具体的文件中，然后最后集中到这里调用，使得下面的显示简短一些
  // 每个操作函数尾部都要加一个记录历史的操作

  deleteEntities(deleteNodes: Entity[]) {
    if (deleteNodes.length === 0) {
      // 此处return 性能优化60ms
      return;
    }
    this.project.deleteManager.deleteEntities(deleteNodes);
    this.project.historyManager.recordStep();
  }

  /**
   * 外部的交互层的delete键可以直接调用这个函数
   */
  deleteSelectedStageObjects() {
    const selectedEntities = this.getEntities().filter((node) => node.isSelected);

    // 检查选中的实体是否在锁定的 section 内，或者实体本身是否是锁定的 section，或者是背景图片
    const filteredEntities = selectedEntities.filter((entity) => {
      return (
        !this.project.sectionMethods.isObjectBeLockedBySection(entity) &&
        !(entity instanceof ImageNode && entity.isBackground)
      );
    });

    for (const entity of filteredEntities) {
      if (entity instanceof PenStroke) {
        this.project.effects.addEffect(PenStrokeDeletedEffect.fromPenStroke(entity));
      } else {
        this.project.effects.addEffect(EntityShrinkEffect.fromEntity(entity));
      }
    }
    this.deleteEntities(filteredEntities);

    // 处理所有类型的边，包括普通边和多目标无向边
    for (const association of this.getAssociations()) {
      if (association.isSelected) {
        // 检查连线是否连接了锁定的 section 内的物体
        if (this.project.sectionMethods.isObjectBeLockedBySection(association)) {
          continue; // 连接了锁定 section 内物体的连线不参与删除
        }

        this.deleteAssociation(association);
        if (association instanceof Edge) {
          this.project.effects.addEffects(this.project.edgeRenderer.getCuttingEffects(association));
        }
      }
    }
  }
  deleteAssociation(deleteAssociation: Association): boolean {
    if (deleteAssociation instanceof Edge) {
      return this.deleteEdge(deleteAssociation);
    } else if (deleteAssociation instanceof MultiTargetUndirectedEdge) {
      const res = this.project.deleteManager.deleteMultiTargetUndirectedEdge(deleteAssociation);
      this.project.historyManager.recordStep();
      return res;
    }
    toast.error("无法删除未知类型的关系");
    return false;
  }

  deleteEdge(deleteEdge: Edge): boolean {
    const res = this.project.deleteManager.deleteEdge(deleteEdge);
    this.project.historyManager.recordStep();
    return res;
  }

  // 一个简单的文案
  private static w = `自环已被禁止，可在设置>控制>连线 中打开允许添加自环选项，
    但您可能并不是想添加自环，您可能是想打开右键菜单，所以请在空白位置右键。
    如果您不需要添加自环的操作但想保持能够通过在节点上右键打开菜单的操作，
    可在设置>控制>连线 中关闭“启用右键点击连线功能”。
    但如果您既要右键点击节点创建连线功能，又想要在节点上右键展开右键菜单操作，很抱歉，这两个功能在逻辑上冲突了。
    `;

  connectEntity(fromNode: ConnectableEntity, toNode: ConnectableEntity, isCrEdge: boolean = false) {
    if (fromNode === toNode && !Settings.allowAddCycleEdge) {
      toast.warning(
        <div>
          <span>{StageManager.w}</span>
        </div>,
      );
      return false;
    }
    if (isCrEdge) {
      this.project.nodeConnector.addCrEdge(fromNode, toNode);
    } else {
      this.project.nodeConnector.connectConnectableEntity(fromNode, toNode);
    }

    this.project.historyManager.recordStep();
    return this.project.graphMethods.isConnected(fromNode, toNode);
  }

  /**
   * 多重连接，只记录一次历史
   * @param fromNodes
   * @param toNode
   * @param isCrEdge
   * @returns
   */
  connectMultipleEntities(
    fromNodes: ConnectableEntity[],
    toNode: ConnectableEntity,
    isCrEdge: boolean = false,
    sourceRectRate?: [number, number],
    targetRectRate?: [number, number],
  ) {
    if (fromNodes.length === 0) {
      return false;
    }
    for (const fromNode of fromNodes) {
      if (fromNode === toNode && !Settings.allowAddCycleEdge) {
        toast.warning(
          <div>
            <h2 className="text-xl">请在空白处右键</h2>
            <span>{StageManager.w}</span>
          </div>,
        );
        continue;
      }
      if (isCrEdge) {
        this.project.nodeConnector.addCrEdge(fromNode, toNode);
      } else {
        this.project.nodeConnector.connectConnectableEntity(fromNode, toNode, "", targetRectRate, sourceRectRate);
      }
    }
    this.project.historyManager.recordStep();
    return true;
  }

  reverseSelectedEdges() {
    const selectedEdges = this.getLineEdges().filter((edge) => edge.isSelected);
    if (selectedEdges.length === 0) {
      return;
    }
    this.project.nodeConnector.reverseEdges(selectedEdges);
  }

  // addSerializedData(serializedData: Serialized.File, diffLocation = new Vector(0, 0)) {
  //   this.project.serializedDataAdder.addSerializedData(serializedData, diffLocation);
  //   this.project.historyManager.recordStep();
  // }

  generateNodeTreeByText(text: string, indention: number = 4, location = this.project.camera.location) {
    this.project.nodeAdder.addNodeTreeByText(text, indention, location);
    this.project.historyManager.recordStep();
  }

  generateNodeGraphByText(text: string, location = this.project.camera.location) {
    try {
      this.project.nodeAdder.addNodeGraphByText(text, location);
      this.project.historyManager.recordStep();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  generateNodeMermaidByText(text: string, location = this.project.camera.location) {
    try {
      this.project.nodeAdder.addNodeMermaidByText(text, location);
      this.project.historyManager.recordStep();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  generateNodeByMarkdown(text: string, location = this.project.camera.location, autoLayout = true) {
    this.project.nodeAdder.addNodeByMarkdown(text, location, autoLayout);
    this.project.historyManager.recordStep();
  }

  /** 将多个实体打包成一个section，并添加到舞台中 */
  async packEntityToSection(addEntities: Entity[]) {
    await this.project.sectionPackManager.packEntityToSection(addEntities);
    this.project.historyManager.recordStep();
  }

  /** 将选中的实体打包成一个section，并添加到舞台中 */
  async packEntityToSectionBySelected() {
    const selectedNodes = this.getSelectedEntities();
    if (selectedNodes.length === 0) {
      return;
    }
    this.packEntityToSection(selectedNodes);
  }

  goInSection(entities: Entity[], section: Section) {
    this.project.sectionInOutManager.goInSection(entities, section);
    this.project.historyManager.recordStep();
  }

  goOutSection(entities: Entity[], section: Section) {
    this.project.sectionInOutManager.goOutSection(entities, section);
    this.project.historyManager.recordStep();
  }
  /** 将所有选中的Section折叠起来 */
  packSelectedSection() {
    this.project.sectionPackManager.packSection();
    this.project.historyManager.recordStep();
  }

  /** 将所有选中的Section展开 */
  unpackSelectedSection() {
    this.project.sectionPackManager.unpackSection();
    this.project.historyManager.recordStep();
  }

  /**
   * 切换选中的Section的折叠状态
   */
  sectionSwitchCollapse() {
    this.project.sectionPackManager.switchCollapse();
    this.project.historyManager.recordStep();
  }

  connectEntityByCrEdge(fromNode: ConnectableEntity, toNode: ConnectableEntity) {
    return this.project.nodeConnector.addCrEdge(fromNode, toNode);
  }

  /**
   * 刷新所有舞台内容
   */
  refreshAllStageObjects() {
    const entities = this.getEntities();
    for (const entity of entities) {
      if (entity instanceof TextNode) {
        if (entity.sizeAdjust === "auto") {
          entity.forceAdjustSizeByText();
        }
      } else if (entity instanceof Section) {
        entity.adjustLocationAndSize();
      }
    }
  }

  /**
   * 刷新选中内容
   */
  refreshSelected() {
    const entities = this.getSelectedEntities();
    for (const entity of entities) {
      if (entity instanceof ImageNode) {
        // entity.refresh();
      }
    }
  }

  /**
   * 改变连线的目标接头点位置
   * @param direction
   */
  changeSelectedEdgeConnectLocation(direction: Direction | null, isSource: boolean = false) {
    const edges = this.getSelectedAssociations().filter((edge) => edge instanceof Edge);
    this.changeEdgesConnectLocation(edges, direction, isSource);
  }

  /**
   * 更改多个连线的目标接头点位置
   * @param edges
   * @param direction
   * @param isSource
   */
  changeEdgesConnectLocation(edges: Edge[], direction: Direction | null, isSource: boolean = false) {
    const newLocationRate = new Vector(0.5, 0.5);
    if (direction === Direction.Left) {
      newLocationRate.x = 0.01;
    } else if (direction === Direction.Right) {
      newLocationRate.x = 0.99;
    } else if (direction === Direction.Up) {
      newLocationRate.y = 0.01;
    } else if (direction === Direction.Down) {
      newLocationRate.y = 0.99;
    }

    for (const edge of edges) {
      if (isSource) {
        edge.sourceRectangleRate = newLocationRate;
      } else {
        edge.targetRectangleRate = newLocationRate;
      }
    }
    // 播放连线调整音效
    SoundService.play.associationAdjustSoundFile();
  }

  switchLineEdgeToCrEdge() {
    const prepareDeleteLineEdge: LineEdge[] = [];
    for (const edge of this.getLineEdges()) {
      if (edge instanceof LineEdge && edge.isSelected) {
        // 删除这个连线，并准备创建cr曲线
        prepareDeleteLineEdge.push(edge);
      }
    }
    for (const lineEdge of prepareDeleteLineEdge) {
      this.deleteEdge(lineEdge);
      this.connectEntityByCrEdge(lineEdge.source, lineEdge.target);
    }
  }

  /**
   * 有向边转无向边
   */
  switchEdgeToUndirectedEdge() {
    const prepareDeleteLineEdge: LineEdge[] = [];
    for (const edge of this.getLineEdges()) {
      if (edge instanceof LineEdge && edge.isSelected) {
        // 删除这个连线，并准备创建
        prepareDeleteLineEdge.push(edge);
      }
    }
    for (const edge of prepareDeleteLineEdge) {
      if (edge.target === edge.source) {
        continue;
      }
      this.deleteEdge(edge);
      const undirectedEdge = MultiTargetUndirectedEdge.createFromSomeEntity(this.project, [edge.target, edge.source]);
      undirectedEdge.text = edge.text;
      undirectedEdge.color = edge.color.clone();
      undirectedEdge.arrow = "outer";
      // undirectedEdge.isSelected = true;
      this.add(undirectedEdge);
    }
  }
  /**
   * 无向边转有向边
   */
  switchUndirectedEdgeToEdge() {
    const prepareDeleteUndirectedEdge: MultiTargetUndirectedEdge[] = [];
    for (const edge of this.getAssociations()) {
      if (edge instanceof MultiTargetUndirectedEdge && edge.isSelected) {
        // 删除这个连线，并准备创建
        prepareDeleteUndirectedEdge.push(edge);
      }
    }
    for (const edge of prepareDeleteUndirectedEdge) {
      if (edge.associationList.length !== 2) {
        continue;
      }

      const [fromNode, toNode] = edge.associationList;
      if (fromNode && toNode && fromNode instanceof ConnectableEntity && toNode instanceof ConnectableEntity) {
        const lineEdge = LineEdge.fromTwoEntity(this.project, fromNode, toNode);
        lineEdge.text = edge.text;
        lineEdge.color = edge.color.clone();
        this.deleteAssociation(edge);
        this.add(lineEdge);
        this.updateReferences();
      }
    }
  }

  addSelectedCREdgeControlPoint() {
    const selectedCREdge = this.getSelectedAssociations().filter((edge) => edge instanceof CubicCatmullRomSplineEdge);
    for (const edge of selectedCREdge) {
      edge.addControlPoint();
    }
  }

  addSelectedCREdgeTension() {
    const selectedCREdge = this.getSelectedAssociations().filter((edge) => edge instanceof CubicCatmullRomSplineEdge);
    for (const edge of selectedCREdge) {
      edge.tension += 0.25;
      edge.tension = Math.min(1, edge.tension);
    }
  }

  reduceSelectedCREdgeTension() {
    const selectedCREdge = this.getSelectedAssociations().filter((edge) => edge instanceof CubicCatmullRomSplineEdge);
    for (const edge of selectedCREdge) {
      edge.tension -= 0.25;
      edge.tension = Math.max(0, edge.tension);
    }
  }

  /**
   * 设置选中Edge的线条类型
   */
  setSelectedEdgeLineType(lineType: string) {
    const selectedEdges = this.getSelectedAssociations().filter((edge) => edge instanceof LineEdge);
    for (const edge of selectedEdges) {
      edge.lineType = lineType;
    }
  }

  /**
   * ctrl + A 全选
   */
  selectAll() {
    const allEntity = this.project.stage;
    for (const entity of allEntity) {
      entity.isSelected = true;
    }
  }
  clearSelectAll() {
    for (const entity of this.project.stage) {
      entity.isSelected = false;
    }
  }
}
