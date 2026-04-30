const escapeClosingTag = (value: string, tagName: string) =>
	value.replace(new RegExp(`</${tagName}`, 'gi'), `<\\/${tagName}`);

export function buildSandboxedHtml(html = '', css = '', js = '') {
	const safeCss = escapeClosingTag(css, 'style');
	const safeJs = escapeClosingTag(js, 'script');

	return `<!doctype html>
<html>
<head>
	<meta charset="utf-8" />
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: https: http:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:;" />
	<style>
		html,
		body {
			width: 100%;
			height: 100%;
			margin: 0;
			overflow: hidden;
		}
		${safeCss}
	</style>
</head>
<body>
	${html}
	<script>
		"use strict";
		${safeJs}
	</script>
</body>
</html>`;
}

export function emptyElement(element: HTMLElement) {
	while (element.firstChild) {
		element.removeChild(element.firstChild);
	}
}
