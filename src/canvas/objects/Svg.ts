import { fabric } from 'fabric';
import { FabricGroup, FabricObject, FabricObjectOption, toObject } from '../utils';

export type SvgObject = (FabricGroup | FabricObject) & {
	loadSvg(option: SvgOption): Promise<SvgObject>;
	setFill(value: string): SvgObject;
	setStroke(value: string): SvgObject;
};

export interface SvgOption extends FabricObjectOption {
	svg?: string;
	src?: string;
	loadType?: 'file' | 'svg';
}

const SVG_DATA_URL_PREFIX = /^data:image\/svg\+xml(?:;[^,]*)?,/i;

const getSvgSource = (option: SvgOption = {}) => option.svg || option.src || '';

const decodeSvgDataUrl = (source: string) => {
	if (!SVG_DATA_URL_PREFIX.test(source)) {
		return null;
	}
	const commaIndex = source.indexOf(',');
	if (commaIndex === -1) {
		return null;
	}
	const header = source.slice(0, commaIndex).toLowerCase();
	const body = source.slice(commaIndex + 1);
	try {
		return header.includes(';base64') ? atob(body) : decodeURIComponent(body);
	} catch (error) {
		return null;
	}
};

const getInlineSvg = (source: string) => {
	const trimmed = source.trim();
	if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml')) {
		return trimmed;
	}
	return decodeSvgDataUrl(trimmed);
};

const Svg = fabric.util.createClass(fabric.Group, {
	type: 'svg',
	initialize(option: SvgOption = {}) {
		this.callSuper('initialize', [], option);
		this.loadSvg(option);
	},
	addSvgElements(objects: FabricObject[], options: any, path: string) {
		const createdObj = fabric.util.groupSVGElements(objects, options, path) as SvgObject;
		this.set(options);
		if (createdObj.getObjects) {
			(createdObj as FabricGroup).getObjects().forEach(obj => {
				this.add(obj);
				if (options.fill) {
					obj.set('fill', options.fill);
				}
				if (options.stroke) {
					obj.set('stroke', options.stroke);
				}
			});
		} else {
			createdObj.set({
				originX: 'center',
				originY: 'center',
			});
			if (options.fill) {
				createdObj.set({
					fill: options.fill,
				});
			}
			if (options.stroke) {
				createdObj.set({
					stroke: options.stroke,
				});
			}
			if (this._objects?.length) {
				(this as FabricGroup)._objects.forEach(obj => this.remove(obj));
			}
			this.add(createdObj);
		}
		this.set({
			fill: options.fill,
			stroke: options.stroke,
		});
		this.setCoords();
		if (this.canvas) {
			this.canvas.requestRenderAll();
		}
		return this;
	},
	loadSvg(option: SvgOption) {
		const { loadType, fill, stroke } = option;
		const source = getSvgSource(option);
		const inlineSvg = getInlineSvg(source);
		return new Promise<SvgObject>(resolve => {
			if (!source) {
				resolve(this);
				return;
			}
			if (loadType === 'svg' || inlineSvg) {
				fabric.loadSVGFromString(inlineSvg || source, (objects, options) => {
					resolve(this.addSvgElements(objects, { ...options, fill, stroke }, source));
				});
			} else {
				fabric.loadSVGFromURL(source, (objects, options) => {
					resolve(this.addSvgElements(objects, { ...options, fill, stroke }, source));
				});
			}
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
			src: this.get('src'),
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
