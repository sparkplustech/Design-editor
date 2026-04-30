const ghpages = require('gh-pages');

ghpages.publish(
	'docs',
	{
		repo: 'https://github.com/salgum1114/react-design-editor.git',
		message: 'published https://salgum1114.github.io/react-design-editor',
		user: {
			name: 'salgum1114',
			email: 'salgum1112@gmail.com',
		},
	},
	function(err) {
		if (err) {
			process.stderr.write(`${err}\n`);
		} else {
			process.stdout.write('published https://salgum1114.github.io/react-design-editor\n');
		}
	},
);
