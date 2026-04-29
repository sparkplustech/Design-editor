const DESIGN_CODE_PATTERN = /^[A-Z0-9_-]{1,128}$/i;

function getParam(params, key, fallback = '') {
	return params.get(key) || fallback;
}

function getDefaultLocation() {
	if (typeof window === 'undefined') {
		return { search: '', pathname: '' };
	}

	return window.location;
}

export function parseEditorSession(location = getDefaultLocation()) {
	const queryParams = new URLSearchParams(location.search);
	const currentPath = location.pathname;
	const designCode = getParam(queryParams, 'designCode');
	const isAdminPath = currentPath.includes('admin');
	const isCertificatePath = currentPath.includes('certificate-designer');
	const isBadgePath = currentPath.includes('badge-designer');
	const isAdminBadgePath = currentPath.includes('admin-badge-designer');

	return {
		queryParams,
		currentPath,
		designCode,
		hasValidDesignCode: DESIGN_CODE_PATTERN.test(designCode),
		isAdminPath,
		isCertificatePath,
		isBadgePath,
		isAdminBadgePath,
		isEdit: queryParams.get('edit') === 'true',
		id: getParam(queryParams, 'id'),
		credId: getParam(queryParams, 'cid'),
		badgeId: getParam(queryParams, 'bid'),
		certId: getParam(queryParams, 'ctid'),
		isDesignTemplate: queryParams.get('dt') === 'true',
		skip: getParam(queryParams, 'sk', '0'),
	};
}
