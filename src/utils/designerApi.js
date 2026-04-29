import CONSTANTS from '../../constant';

const API_BASE_URL = CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL;

export function getDesignCode() {
	const queryParams = new URLSearchParams(window.location.search);
	const designCode = queryParams.get('designCode');

	if (!designCode) {
		throw new Error('Missing design code.');
	}

	return designCode;
}

export function authHeaders(accessToken) {
	return {
		Authorization: `Bearer ${accessToken}`,
	};
}

export async function fetchDesignerJson(path, options = {}) {
	if (!API_BASE_URL) {
		throw new Error('Designer API is not configured for this design code.');
	}

	const response = await fetch(`${API_BASE_URL}${path}`, options);
	const responseText = await response.text();
	let payload = null;

	if (responseText) {
		try {
			payload = JSON.parse(responseText);
		} catch (error) {
			throw new Error('Designer API returned invalid JSON.');
		}
	}

	if (!response.ok) {
		const message = payload?.message || payload?.error || `Designer API request failed with ${response.status}.`;
		throw new Error(message);
	}

	return payload;
}

export async function loadDesignerSession() {
	const designCode = getDesignCode();
	const session = await fetchDesignerJson(`/templates/getusertoken/${encodeURIComponent(designCode)}`);

	if (!session?.accessToken) {
		throw new Error('Designer session token is missing.');
	}

	return session;
}

export function getCanvasObjects(templateCode) {
	const objects = templateCode?.objects;

	if (!Array.isArray(objects)) {
		throw new Error('Template does not contain canvas objects.');
	}

	return objects;
}
