import UnsafetyWordException from '../exception/UnsafetyWordException';
import NoExistWordException from '../exception/NoExistWordException';

const excludeWords = [
	'window',
	'Window',
	'globalThis',
	'alert',
	'console',
	'this',
	'eval',
	'new',
	'function',
	'Function',
	'constructor',
	'prototype',
	'document',
	'fetch',
	'XMLHttpRequest',
	'localStorage',
	'sessionStorage',
	'import',
	'setTimeout',
	'setInterval',
];

const includeWords = ['return'];

class SandBox {
	/**
	 *Creates an instance of SandBox.
	 * @param {{ excludeWords: string[], includeWords: string[] }} params
	 * @memberof SandBox
	 */
	constructor(params = {}) {
		this.excludeWords = params.excludeWords || excludeWords;
		this.includeWords = params.includeWords || includeWords;
	}

	parseJsonOption(code) {
		const newCode = code.toString().trim();
		if (this.excludeWords.some(word => new RegExp(`(^|[^\\w$])${word}([^\\w$]|$)`).test(newCode))) {
			throw new UnsafetyWordException();
		}

		const jsonOption = newCode.replace(/^return\s+/i, '').replace(/;$/, '');
		if (!jsonOption.startsWith('{') || !jsonOption.endsWith('}')) {
			throw new NoExistWordException();
		}

		return JSON.parse(jsonOption);
	}

	// eslint-disable-next-line consistent-return
	compile(code) {
		try {
			const chartOption = this.parseJsonOption(code);
			return () => chartOption;
		} catch (error) {
			return null;
		}
	}
}

export default SandBox;
