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

const parameters = ['value', 'animations', 'styles', 'userProperty'];

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

	// eslint-disable-next-line class-methods-use-this
	verify(code) {
		const newCode = code.toString();
		if (this.excludeWords.some(word => new RegExp(`(^|[^\\w$])${word}([^\\w$]|$)`).test(newCode))) {
			throw new UnsafetyWordException();
		}
		if (!this.includeWords.some(word => code.includes(word))) {
			throw new NoExistWordException();
		}
		// eslint-disable-next-line no-new-func
		return new Function(parameters, `"use strict"; ${newCode}`);
	}

	// eslint-disable-next-line consistent-return
	compile(code) {
		try {
			return this.verify(code);
		} catch (error) {
			return null;
		}
	}
}

export default SandBox;
