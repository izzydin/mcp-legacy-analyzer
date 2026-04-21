import * as t from '@babel/types';
export const GhostHunterRule = {
    id: 'ghost-hunter',
    visitor: {
        ClassMethod(path, state) {
            if (t.isIdentifier(path.node.key)) {
                const methodName = path.node.key.name;
                let replacement = '';
                if (methodName === 'componentWillMount' || methodName === 'UNSAFE_componentWillMount') {
                    replacement = 'componentDidMount or constructor';
                }
                else if (methodName === 'componentWillReceiveProps' || methodName === 'UNSAFE_componentWillReceiveProps') {
                    replacement = 'static getDerivedStateFromProps';
                }
                else if (methodName === 'componentWillUpdate' || methodName === 'UNSAFE_componentWillUpdate') {
                    replacement = 'getSnapshotBeforeUpdate and componentDidUpdate';
                }
                if (replacement) {
                    state.report({
                        ruleId: 'ghost-hunter',
                        message: `The lifecycle method '${methodName}' is deprecated and unsafe for React 18 Concurrent Mode. It can lead to bugs with async rendering.`,
                        action: `Replace with ${replacement}.`,
                        severity: 'warning',
                        line: path.node.loc?.start.line ?? -1,
                        column: path.node.loc?.start.column ?? -1
                    });
                }
            }
        }
    }
};
