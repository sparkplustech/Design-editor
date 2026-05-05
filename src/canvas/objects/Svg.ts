import * as fabric from 'fabric';
import { FabricGroup, FabricObject, FabricObjectOption, toObject } from '../utils';
import { resolveSvgText } from '../../utils/svgSanitizer';

export type SvgObject = (FabricGroup | FabricObject) & {
	loadSvg(option: SvgOption): Promise<SvgObject>;
	setFill(value: string): SvgObject;
	setStroke(value: string): SvgObject;
};

export interface SvgOption extends FabricObjectOption {
	svg?: string;
	loadType?: 'file' | 'svg';
}

const Svg = fabric.util.createClass(fabric.Group, {
	type: 'svg',
	initialize(option: SvgOption = {}) {
		this.callSuper('initialize', [], option);
		if (Array.isArray((option as any).objects) && (option as any).objects.length > 0) {
			this.loadSerializedObjects(option);
			return;
		}
		this.loadSvg(option);
	},
	loadSerializedObjects(option: SvgOption) {
		const { objects: serializedObjects, ...savedObjectOption } = option as any;
		const onLoaded = (objects: FabricObject[]) => {
			objects.filter(Boolean).forEach(obj => this.add(obj));
			this.set(savedObjectOption);
			this.setCoords();
			if (this.canvas) {
				this.canvas.requestRenderAll();
			}
		};
		const result = (fabric.util.enlivenObjects as any)(serializedObjects);
		if (result?.then) {
			result.then(onLoaded);
			return this;
		}
		(fabric.util.enlivenObjects as any)(serializedObjects, onLoaded);
		return this;
	},
	addSvgElements(objects: FabricObject[], options: any, path: string, sourceOption: SvgOption = {}) {
		const { objects: _serializedObjects, svg: _svg, loadType: _loadType, ...savedObjectOption } = sourceOption as any;
		const nextOptions = { ...options, ...savedObjectOption };
		const createdObj = fabric.util.groupSVGElements(objects, { ...options }, path) as SvgObject;
		this.set(nextOptions);
		if (createdObj.getObjects) {
			(createdObj as FabricGroup).getObjects().forEach(obj => {
				this.add(obj);
				if (nextOptions.fill) {
					obj.set('fill', nextOptions.fill);
				}
				if (nextOptions.stroke) {
					obj.set('stroke', nextOptions.stroke);
				}
			});
		} else {
			createdObj.set({
				originX: 'center',
				originY: 'center',
			});
			if (nextOptions.fill) {
				createdObj.set({
					fill: nextOptions.fill,
				});
			}
			if (nextOptions.stroke) {
				createdObj.set({
					stroke: nextOptions.stroke,
				});
			}
			if (this._objects?.length) {
				(this as FabricGroup)._objects.forEach(obj => this.remove(obj));
			}
			this.add(createdObj);
		}
		this.set({
			fill: nextOptions.fill,
			stroke: nextOptions.stroke,
		});
		this.set(nextOptions);
		this.setCoords();
		if (this.canvas) {
			this.canvas.requestRenderAll();
		}
		return this;
	},
	loadSvg(option: SvgOption) {
		const { svg, loadType, fill, stroke } = option;
		return new Promise<SvgObject>((resolve, reject) => {
			resolveSvgText(svg, loadType)
				.then((safeSvg: string) => {
					const onLoaded = (objects: FabricObject[], options: any) => {
						resolve(this.addSvgElements(objects, { ...options, fill, stroke }, safeSvg, option));
					};
					const result = (fabric.loadSVGFromString as any)(safeSvg);

					if (result?.then) {
						result
							.then(({ objects, options }: { objects: FabricObject[]; options: any }) => {
								onLoaded(objects, options);
							})
							.catch(reject);
						return;
					}

					(fabric.loadSVGFromString as any)(safeSvg, (objects: FabricObject[], options: any) => {
						onLoaded(objects, options);
					});
				})
				.catch(reject);
		});
	},
	setFill(value: any) {
		this.getObjects().forEach((obj: FabricObject) => obj.set('fill', value));
		return this;
	},
	setStroke(value: any) {
		this.getObjects().forEach((obj: FabricObject) => obj.set('stroke', value));
		return this;
	},
	toObject(propertiesToInclude: string[]) {
		return toObject(this, propertiesToInclude, {
			svg: this.get('svg'),
			loadType: this.get('loadType'),
		});
	},
	_render(ctx: CanvasRenderingContext2D) {
		this.callSuper('_render', ctx);
	},
});

Svg.fromObject = (option: SvgOption, callback: (obj: SvgObject) => any) => {
	return callback(new Svg(option));
};

// @ts-ignore
window.fabric.Svg = Svg;

export default Svg;
