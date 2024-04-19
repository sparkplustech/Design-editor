import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Title from './components/layout/Title';
import FlowContainer from './containers/FlowContainer';
import { FiberEditor, HexGridEditor, WorkflowEditor } from './editors';

import loadable from '@loadable/component';
const ImageMapEditor = loadable(() => import('./editors/imagemap'));
const FlowEditor = loadable(() => import('./editors/flow'));

type EditorType = 'imagemap' | 'workflow' | 'flow' | 'hexgrid' | 'fiber';

interface IState {
	activeEditor?: EditorType;
}

class App extends Component<any, IState> {
	state: IState = {
		activeEditor: 'imagemap',
	};

	handleChangeEditor = ({ key }) => {
		this.setState({
			activeEditor: key,
		});
	};

	renderEditor = (activeEditor: EditorType) => {
		switch (activeEditor) {
			case 'imagemap':
				return <ImageMapEditor />;
			case 'workflow':
				return <WorkflowEditor />;
			case 'flow':
				return <FlowEditor />;
			case 'hexgrid':
				return <HexGridEditor />;
			case 'fiber':
				return <FiberEditor />;
		}
	};

	render() {
		const { activeEditor } = this.state;
		return (
			<Router>
				<div className="rde-main">
					<Helmet>
						<meta charSet="utf-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1.0" />
						<meta name="description" content=" " />
						<link rel="manifest" href="./manifest.json" />
						<link rel="shortcut icon" href="./favicon.ico" />
						<link rel="stylesheet" href="https://fonts.googleapis.com/earlyaccess/notosanskr.css" />
						<title>Designer | SOLO ECOSYSTEM</title>
						<script async={true} src="https://www.googletagmanager.com/gtag/js?id=G-EH7WWSK514" />
						<script>
							{`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-EH7WWSK514');
                        `}
						</script>
						<script async={true} src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js" />
					</Helmet>
					{/* <div className="rde-title">
						<Title onChangeEditor={this.handleChangeEditor} currentEditor={activeEditor} />
					</div> */}
					<FlowContainer>
						<Routes>
							<Route path="/" element={<Navigate to="/certificate-designer" />} />
							<Route path="/certificate-designer" element={this.renderEditor(activeEditor)} />
							<Route path="/badge-designer" element={this.renderEditor(activeEditor)} />
							<Route path="/admin-certificate-designer" element={this.renderEditor(activeEditor)} />
							<Route path="/admin-badge-designer" element={this.renderEditor(activeEditor)} />
						</Routes>
					</FlowContainer>
				</div>
			</Router>
		);
	}
}

export default App;
