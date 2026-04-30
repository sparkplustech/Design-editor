export const DESIGN_VARIABLE_GROUPS = [
	{
		title: 'Issuer',
		items: [
			{ label: 'Issuer Name', token: '[IssuerName]' },
			{ label: 'Issuer Logo', token: '[IssuerLogo]' },
			{ label: 'Issuer Website', token: '[IssuerWebsite]' },
		],
	},
	{
		title: 'Credential',
		items: [
			{ label: 'Credential ID', token: '[CredentialId]' },
			{ label: 'Credential Name', token: '[CredentialName]' },
			{ label: 'Issue Date', token: '[IssueDate]' },
			{ label: 'Expiry Date', token: '[ExpiryDate]' },
			{ label: 'Start Date', token: '[startDate]' },
			{ label: 'End Date', token: '[endDate]' },
			{ label: 'URL', token: '[Url]' },
			{ label: 'UUID', token: '[Uuid]' },
			{ label: 'Level', token: '[Level]' },
			{ label: 'QR Code', token: '[QRCode]' },
		],
	},
	{
		title: 'Recipient',
		items: [{ label: 'Recipient Name', token: '[RecipientName]' }],
	},
];

export const DESIGN_VARIABLE_TOKENS = DESIGN_VARIABLE_GROUPS.reduce(
	(tokens, group) => tokens.concat(group.items.map(item => item.token)),
	[],
);
