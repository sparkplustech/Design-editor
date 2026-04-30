import * as fabric from 'fabric';

type Constructor = {
	new (...args: any[]): any;
	prototype: any;
	__fabricCompatClass?: boolean;
};

type FabricNamespace = typeof fabric & {
	util: typeof fabric.util & {
		createClass?: (parent: Constructor, properties?: Record<string, any>) => Constructor;
		object?: {
			extend?: <T extends Record<string, any>, U extends Record<string, any>>(destination: T, source: U) => T & U;
		};
	};
};

const fabricCompat = fabric as FabricNamespace;

const copyPendingProperties = (target: any, pending: Record<PropertyKey, any>) => {
	Reflect.ownKeys(pending).forEach(key => {
		target[key] = pending[key];
	});
};

const stripReadonlyTypeOption = (args: any[]) => {
	const nextArgs = [...args];
	const optionIndex = nextArgs.length - 1;
	const options = nextArgs[optionIndex];
	if (options && typeof options === 'object' && !Array.isArray(options) && Object.prototype.hasOwnProperty.call(options, 'type')) {
		const { type: _type, ...rest } = options;
		nextArgs[optionIndex] = rest;
	}
	return nextArgs;
};

const createSuperCaller = (Parent: Constructor, instanceRef: () => any, createParent?: (...args: any[]) => any) =>
	function callSuper(this: any, methodName: string, ...args: any[]) {
		if (methodName === 'initialize') {
			return createParent ? createParent(...args) : undefined;
		}
		const parentMethod = Parent.prototype && Parent.prototype[methodName];
		if (typeof parentMethod !== 'function') {
			return undefined;
		}
		return parentMethod.apply(instanceRef() || this, args);
	};

const wrapMethod = (Parent: Constructor, method: (...args: any[]) => any) =>
	function wrappedFabricCompatMethod(this: any, ...args: any[]) {
		const previousCallSuper = this.callSuper;
		this.callSuper = createSuperCaller(Parent, () => this);
		try {
			return method.apply(this, args);
		} finally {
			if (previousCallSuper) {
				this.callSuper = previousCallSuper;
			} else {
				delete this.callSuper;
			}
		}
	};

if (!fabricCompat.util.object) {
	fabricCompat.util.object = {};
}

if (!fabricCompat.util.object.extend) {
	fabricCompat.util.object.extend = (destination, source) => Object.assign(destination, source);
}

if (!fabricCompat.util.createClass) {
	fabricCompat.util.createClass = (Parent: Constructor, properties: Record<string, any> = {}) => {
		function FabricCompatClass(this: any, ...args: any[]) {
			let parentInstance: any;
			const pendingProperties: Record<PropertyKey, any> = {};
			const NewTarget = new.target || FabricCompatClass;
			const createParent = (...parentArgs: any[]) => {
				if (!parentInstance) {
					const safeParentArgs = Parent.__fabricCompatClass ? parentArgs : stripReadonlyTypeOption(parentArgs);
					parentInstance = Reflect.construct(Parent, safeParentArgs, NewTarget);
					copyPendingProperties(parentInstance, pendingProperties);
				}
				return parentInstance;
			};
			const initializerThis = new Proxy(pendingProperties, {
				get(target, property) {
					if (property === 'callSuper') {
						return createSuperCaller(Parent, () => parentInstance, createParent);
					}
					if (parentInstance) {
						return parentInstance[property as keyof typeof parentInstance];
					}
					return target[property];
				},
				set(target, property, value) {
					if (parentInstance) {
						parentInstance[property as keyof typeof parentInstance] = value;
					} else {
						target[property] = value;
					}
					return true;
				},
			});

			if (typeof properties.initialize === 'function') {
				properties.initialize.apply(initializerThis, args);
			}

			if (!parentInstance) {
				const safeArgs = Parent.__fabricCompatClass ? args : stripReadonlyTypeOption(args);
				parentInstance = Reflect.construct(Parent, safeArgs, NewTarget);
			}
			copyPendingProperties(parentInstance, pendingProperties);
			return parentInstance;
		}

		FabricCompatClass.prototype = Object.create(Parent.prototype);
		Object.defineProperty(FabricCompatClass.prototype, 'constructor', {
			value: FabricCompatClass,
			writable: true,
			configurable: true,
		});
		Object.setPrototypeOf(FabricCompatClass, Parent);
		Object.defineProperty(FabricCompatClass, '__fabricCompatClass', {
			value: true,
			configurable: false,
		});
		if (typeof properties.type === 'string') {
			Object.defineProperty(FabricCompatClass, 'type', {
				value: properties.type,
				writable: true,
				configurable: true,
				enumerable: true,
			});
		}

		Object.keys(properties).forEach(key => {
			if (key === 'type') {
				return;
			}
			if (key === 'initialize') {
				FabricCompatClass.prototype.initialize = wrapMethod(Parent, properties.initialize);
				return;
			}
			const value = properties[key];
			FabricCompatClass.prototype[key] =
				typeof value === 'function' ? wrapMethod(Parent, value) : value;
		});

		return FabricCompatClass as Constructor;
	};
}

const canvasPrototype = (fabricCompat as any).Canvas && (fabricCompat as any).Canvas.prototype;

if (canvasPrototype && !canvasPrototype.setBackgroundColor) {
	canvasPrototype.setBackgroundColor = function setBackgroundColor(backgroundColor: any, callback?: () => void) {
		this.backgroundColor = backgroundColor;
		this.requestRenderAll();
		if (callback) {
			callback();
		}
		return this;
	};
}

if (canvasPrototype && !canvasPrototype.setWidth) {
	canvasPrototype.setWidth = function setWidth(width: number) {
		this.setDimensions({ width });
		return this;
	};
}

if (canvasPrototype && !canvasPrototype.setHeight) {
	canvasPrototype.setHeight = function setHeight(height: number) {
		this.setDimensions({ height });
		return this;
	};
}

if (canvasPrototype && !canvasPrototype.getCenter) {
	canvasPrototype.getCenter = function getCenter() {
		return {
			left: this.getWidth() / 2,
			top: this.getHeight() / 2,
		};
	};
}

if (canvasPrototype && !canvasPrototype.getPointer) {
	canvasPrototype.getPointer = function getPointer(event: MouseEvent) {
		if (typeof this.getScenePoint === 'function') {
			return this.getScenePoint(event);
		}
		if (typeof this.getViewportPoint === 'function') {
			return this.getViewportPoint(event);
		}

		const bounds = this.upperCanvasEl.getBoundingClientRect();
		const viewportPoint = new fabric.Point(event.clientX - bounds.left, event.clientY - bounds.top);

		if (this.viewportTransform && fabric.util.invertTransform) {
			return fabric.util.transformPoint(viewportPoint, fabric.util.invertTransform(this.viewportTransform));
		}

		return viewportPoint;
	};
}

if (typeof window !== 'undefined' && !(window as any).fabric) {
	(window as any).fabric = {
		...fabricCompat,
		util: fabricCompat.util,
	};
}

export default fabricCompat;
