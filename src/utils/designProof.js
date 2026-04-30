import { DESIGN_VARIABLE_TOKENS } from './designVariables';

const SAFE_AREA_TOLERANCE = 2;
const MIN_QR_SIZE = 80;
const VARIABLE_PATTERN = /\[[A-Za-z0-9_]+\]/g;

function getObjects(handler) {
	if (!handler) {
		return [];
	}
	if (typeof handler.getObjects === 'function') {
		return handler.getObjects();
	}
	if (handler.canvas && typeof handler.canvas.getObjects === 'function') {
		return handler.canvas.getObjects();
	}
	return [];
}

function getBounds(object) {
	if (object && typeof object.getBoundingRect === 'function') {
		return object.getBoundingRect(true, true);
	}

	return {
		left: object?.left || 0,
		top: object?.top || 0,
		width: (object?.width || 0) * (object?.scaleX || 1),
		height: (object?.height || 0) * (object?.scaleY || 1),
	};
}

function getObjectLabel(object, index) {
	return object?.name || object?.text || object?.type || `Object ${index + 1}`;
}

function isOutsideSafeArea(bounds, workareaBounds) {
	return (
		bounds.left < workareaBounds.left - SAFE_AREA_TOLERANCE ||
		bounds.top < workareaBounds.top - SAFE_AREA_TOLERANCE ||
		bounds.left + bounds.width > workareaBounds.left + workareaBounds.width + SAFE_AREA_TOLERANCE ||
		bounds.top + bounds.height > workareaBounds.top + workareaBounds.height + SAFE_AREA_TOLERANCE
	);
}

function getUnknownVariableTokens(text) {
	if (typeof text !== 'string') {
		return [];
	}

	return Array.from(new Set(text.match(VARIABLE_PATTERN) || [])).filter(token => !DESIGN_VARIABLE_TOKENS.includes(token));
}

function getTextOverflowIssue(object, label) {
	if (!object || typeof object.calcTextHeight !== 'function' || !object.height) {
		return null;
	}

	const textHeight = object.calcTextHeight();
	if (textHeight > object.height + SAFE_AREA_TOLERANCE) {
		return {
			severity: 'warning',
			message: `${label} may overflow its text box after variable replacement.`,
		};
	}

	return null;
}

function getQrIssues(object, bounds, label) {
	if (object?.name !== 'attribute-qr') {
		return [];
	}

	const issues = [];
	const hasImageSource = Boolean(object.src || object._element?.src);

	if (!hasImageSource) {
		issues.push({
			severity: 'warning',
			message: `${label} has no QR image source.`,
		});
	}
	if (bounds.width < MIN_QR_SIZE || bounds.height < MIN_QR_SIZE) {
		issues.push({
			severity: 'warning',
			message: `${label} should be at least ${MIN_QR_SIZE}px wide and tall for reliable scanning.`,
		});
	}

	return issues;
}

export function getDesignProofIssues(canvasRef) {
	const handler = canvasRef?.handler;
	const workarea = handler?.workarea;

	if (!handler || !workarea) {
		return [
			{
				severity: 'error',
				message: 'Canvas workarea is not ready for proof validation.',
			},
		];
	}

	const workareaBounds = getBounds(workarea);
	const canvasObjects = getObjects(handler).filter(object => object?.id !== 'workarea' && object?.id !== 'grid');
	const issues = [];

	canvasObjects.forEach((object, index) => {
		const label = getObjectLabel(object, index);
		const bounds = getBounds(object);

		if (!bounds.width || !bounds.height) {
			issues.push({
				severity: 'warning',
				message: `${label} has no printable size.`,
			});
		}
		if (isOutsideSafeArea(bounds, workareaBounds)) {
			issues.push({
				severity: 'warning',
				message: `${label} is outside the design safe area.`,
			});
		}

		const unknownTokens = getUnknownVariableTokens(object.text);
		if (unknownTokens.length > 0) {
			issues.push({
				severity: 'warning',
				message: `${label} uses unknown variable token(s): ${unknownTokens.join(', ')}.`,
			});
		}

		const textOverflowIssue = getTextOverflowIssue(object, label);
		if (textOverflowIssue) {
			issues.push(textOverflowIssue);
		}

		issues.push(...getQrIssues(object, bounds, label));
	});

	return issues;
}

export function getBlockingProofIssues(issues) {
	return issues.filter(issue => issue.severity === 'error');
}

export function summarizeProofIssues(issues) {
	if (!issues.length) {
		return 'Proof checks passed.';
	}

	const firstIssue = issues[0].message;
	const suffix = issues.length > 1 ? ` (+${issues.length - 1} more)` : '';
	return `Proof check: ${firstIssue}${suffix}`;
}
