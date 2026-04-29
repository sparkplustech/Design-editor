const SVG_MAX_BYTES = 1024 * 1024;
const DISALLOWED_TAGS = new Set([
	'script',
	'foreignobject',
	'iframe',
	'object',
	'embed',
	'link',
	'meta',
	'base',
	'style',
	'audio',
	'video',
	'canvas',
]);
const URL_ATTRIBUTES = new Set(['href', 'xlink:href', 'src']);

function getByteLength(value) {
	if (typeof TextEncoder !== 'undefined') {
		return new TextEncoder().encode(value).length;
	}

	return new Blob([value]).size;
}

function decodeBase64(value) {
	const binary = window.atob(value);
	let encoded = '';

	for (let index = 0; index < binary.length; index += 1) {
		encoded += `%${`00${binary.charCodeAt(index).toString(16)}`.slice(-2)}`;
	}

	try {
		return decodeURIComponent(encoded);
	} catch (error) {
		return binary;
	}
}

function decodeSvgDataUrl(source) {
	const match = source.match(/^data:image\/svg\+xml(?:;charset=[^;,]+)?(;base64)?,(.*)$/i);

	if (!match) {
		return null;
	}

	return match[1] ? decodeBase64(match[2]) : decodeURIComponent(match[2]);
}

function isUnsafeUrlAttribute(value) {
	const normalized = value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase();

	if (!normalized) return false;
	if (normalized.startsWith('#')) return false;
	if (/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(normalized)) return false;

	return true;
}

function sanitizeStyle(value) {
	if (/javascript:|expression\s*\(|@import/i.test(value)) {
		return '';
	}
	if (/url\s*\(\s*['"]?(?!#)/i.test(value)) {
		return '';
	}
	return value;
}

export function sanitizeSvgText(rawSvg) {
	if (typeof rawSvg !== 'string' || rawSvg.trim() === '') {
		throw new Error('SVG content is empty.');
	}
	if (getByteLength(rawSvg) > SVG_MAX_BYTES) {
		throw new Error('SVG file is larger than the supported 1MB limit.');
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
	const parserError = doc.querySelector('parsererror');
	const root = doc.documentElement;

	if (parserError || !root || root.tagName.toLowerCase() !== 'svg') {
		throw new Error('SVG content is not valid.');
	}

	const walker = doc.createTreeWalker(root, 1);
	const nodesToRemove = [];
	let currentNode = walker.currentNode;

	while (currentNode) {
		const element = currentNode;
		const tagName = element.tagName.toLowerCase();

		if (DISALLOWED_TAGS.has(tagName)) {
			nodesToRemove.push(element);
		} else {
			Array.from(element.attributes).forEach(attribute => {
				const name = attribute.name.toLowerCase();
				const value = attribute.value || '';

				if (name.startsWith('on')) {
					element.removeAttribute(attribute.name);
					return;
				}
				if (URL_ATTRIBUTES.has(name) && isUnsafeUrlAttribute(value)) {
					element.removeAttribute(attribute.name);
					return;
				}
				if (name === 'style') {
					const safeStyle = sanitizeStyle(value);
					if (safeStyle) {
						element.setAttribute(attribute.name, safeStyle);
					} else {
						element.removeAttribute(attribute.name);
					}
					return;
				}
				if (/javascript:|data:text\/html|url\s*\(\s*['"]?(?!#)/i.test(value)) {
					element.removeAttribute(attribute.name);
				}
			});
		}

		currentNode = walker.nextNode();
	}

	nodesToRemove.forEach(node => node.parentNode && node.parentNode.removeChild(node));

	if (!root.getAttribute('xmlns')) {
		root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	}

	return new XMLSerializer().serializeToString(root);
}

export async function readSvgFile(file) {
	const text = await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = event => resolve(event.target.result);
		reader.onerror = () => reject(new Error('Unable to read SVG file.'));
		reader.readAsText(file);
	});

	return sanitizeSvgText(text);
}

export async function fetchSvgText(url) {
	const response = await fetch(url, {
		headers: {
			Accept: 'image/svg+xml,text/plain;q=0.9,*/*;q=0.8',
		},
	});

	if (!response.ok) {
		throw new Error(`Unable to load SVG (${response.status}).`);
	}

	return sanitizeSvgText(await response.text());
}

export async function resolveSvgText(source, loadType) {
	if (!source) {
		throw new Error('SVG source is missing.');
	}

	const dataUrlSvg = typeof source === 'string' ? decodeSvgDataUrl(source) : null;

	if (dataUrlSvg !== null) {
		return sanitizeSvgText(dataUrlSvg);
	}
	if (loadType === 'svg') {
		return sanitizeSvgText(source);
	}

	return fetchSvgText(source);
}
