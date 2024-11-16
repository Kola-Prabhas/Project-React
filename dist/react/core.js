function mapComponentToTaggedUnion(component) {
    return typeof component === "string"
        ? { kind: "tag", tagName: component, domRef: null }
        : { kind: "function", function: component, name: component.name };
}
function mapExternalMetadataToInternalMetadata({ externalMetadata }) {
    return {
        // provider: null,
        kind: "real-element",
        component: mapComponentToTaggedUnion(externalMetadata.component),
        children: externalMetadata.children.map((child) => {
            const slotNode = {
                kind: "empty-slot",
            };
            if (!child) {
                return slotNode;
            }
            if (child.kind === "empty-slot") {
                return slotNode;
            }
            return child;
        }),
        props: externalMetadata.props,
        id: crypto.randomUUID(),
    };
}
export function createElement(component, props, ...children) {
    const internalMetadata = mapExternalMetadataToInternalMetadata({
        externalMetadata: {
            component,
            props,
            children
        }
    });
    return internalMetadata;
}
const currentTreeRef = {
    viewTree: null,
    renderTree: null
};
function isChildOf({ potentialChildId, potentialParentId, }) {
    const aux = ({ node, searchId, }) => {
        if (node.kind === "empty-slot") {
            return;
        }
        if (node.internalMetadata.kind === "empty-slot") {
            return;
        }
        if (node.internalMetadata.id === searchId) {
            return node;
        }
        for (const child of node.childNodes) {
            const res = aux({
                node: child,
                searchId,
            });
            if (res) {
                return res;
            }
        }
    };
    if (!currentTreeRef.renderTree) {
        throw new Error("Invariant error must have render tree");
    }
    const start = aux({
        node: currentTreeRef.renderTree.root,
        searchId: potentialParentId,
    });
    if (!start) {
        throw new Error("Invariant error can't start from a detached node");
    }
    return !!aux({
        node: start,
        searchId: potentialChildId,
    });
}
;
function getComponentName(internalMetadata) {
    if (internalMetadata.kind === 'empty-slot') {
        return internalMetadata.kind;
    }
    switch (internalMetadata.component.kind) {
        case "function": {
            return internalMetadata.component.name;
        }
        case "tag": {
            return internalMetadata.component.tagName;
        }
    }
}
function compareIndexPaths(leftIndexPath, rightIndexPath) {
    if (leftIndexPath.length !== rightIndexPath.length) {
        return false;
    }
    for (let i = 0; i < leftIndexPath.length; i++) {
        const leftIndex = leftIndexPath[i];
        const rightIndex = rightIndexPath[i];
        if (leftIndex !== rightIndex) {
            return false;
        }
    }
    return true;
}
;
function reconcileChildRenderNodes({ oldChildRenderNodes, newChildRenderNodes }) {
    const reconciledRenderNodes = [];
    newChildRenderNodes.forEach((newNode, index) => {
        const oldNode = oldChildRenderNodes.at(index);
        if (!oldNode) {
            reconciledRenderNodes.push(newNode);
            return;
        }
        if (newNode.kind === 'empty-slot' || oldNode?.kind === 'empty-slot') {
            reconciledRenderNodes.push(newNode);
            return;
        }
        if (!compareIndexPaths(oldNode.indexPath, newNode.indexPath) ||
            getComponentName(oldNode.internalMetadata) !== getComponentName(newNode.internalMetadata)) {
            reconciledRenderNodes.push(newNode);
            return;
        }
        oldNode.internalMetadata = newNode.internalMetadata;
        oldNode.computedViewTreeNodeId = null;
        reconciledRenderNodes.push(oldNode);
    });
    return reconciledRenderNodes;
}
function findExistingRenderNodeOrThrow(predicate, tree) {
    const aux = (node) => {
        if (predicate(node)) {
            return node;
        }
        if (node.kind === 'empty-slot' ||
            node.internalMetadata.kind == 'empty-slot') {
            return null;
        }
        for (const childNode of node.childNodes) {
            if (predicate(childNode)) {
                return childNode;
            }
            const foundNode = aux(childNode);
            if (foundNode) {
                return foundNode;
            }
        }
        return null;
    };
    const existingNode = aux(tree);
    if (existingNode) {
        return existingNode;
    }
    throw new Error('Invaraint Error: Already Rendered Node not found or wrong internalMetadata Id');
}
function findExistingViewNodeOrThrow(predicate, tree) {
    const aux = (node) => {
        if (predicate(node)) {
            return node;
        }
        if (node.kind === 'empty-slot' ||
            node.metadata.kind == 'empty-slot') {
            return null;
        }
        for (const childNode of node.childNodes) {
            if (predicate(childNode)) {
                return childNode;
            }
            const foundNode = aux(childNode);
            if (foundNode) {
                return foundNode;
            }
        }
        return null;
    };
    const existingNode = aux(tree);
    if (existingNode) {
        return existingNode;
    }
    throw new Error('Invaraint Error: Already Rendered viewNode not found or wrong metadata Id');
}
function findExistingRenderNode(predicate, tree) {
    try {
        const existingRenderNode = findExistingRenderNodeOrThrow(predicate, tree);
        return existingRenderNode;
    }
    catch {
        return null;
    }
}
function findExistingViewNode(predicate, tree) {
    try {
        const existingViewNode = findExistingViewNodeOrThrow(predicate, tree);
        return existingViewNode;
    }
    catch {
        return null;
    }
}
function generateRenderNodeChildNodes({ internalMetadata, parentRenderNode }) {
    const childNodes = [];
    const aux = ({ indexPath, internalMetadata, parentRenderNode }) => {
        if (!currentTreeRef.renderTree) {
            throw new Error('Cannot Render node without render tree!');
        }
        const existingNode = internalMetadata.kind === 'empty-slot'
            ? null
            : findExistingRenderNode((node) => {
                if (node.kind === 'empty-slot') {
                    return false;
                }
                if (node.internalMetadata.kind === 'empty-slot') {
                    return false;
                }
                return node.internalMetadata.id === internalMetadata.id;
            }, currentTreeRef.renderTree.root);
        if (existingNode) {
            return;
        }
        if (internalMetadata.kind === 'empty-slot') {
            const emptySlotRenderNode = {
                kind: 'empty-slot',
                parent: parentRenderNode
            };
            childNodes.push(emptySlotRenderNode);
            return;
        }
        const renderNode = {
            id: crypto.randomUUID(),
            kind: 'real-element',
            childNodes: [],
            computedViewTreeNodeId: null,
            internalMetadata,
            indexPath,
            hasRendered: false,
            parent: parentRenderNode
        };
        childNodes.push(renderNode);
        if (renderNode.internalMetadata.kind === 'empty-slot') {
            return;
        }
        renderNode.internalMetadata.children.forEach((child, index) => {
            aux({
                indexPath: [...indexPath, index],
                internalMetadata: child,
                parentRenderNode: renderNode
            });
        });
    };
    aux({
        indexPath: [],
        internalMetadata,
        parentRenderNode
    });
    return childNodes;
}
function generateReactTreesHelper({ renderNode, parentViewNode, startingFromRenderNodeId,
// isEntryPoint = false
 }) {
    if (!currentTreeRef.renderTree?.root) {
        throw new Error('Cannot Render node without render tree!');
    }
    if (renderNode.kind === 'empty-slot' || renderNode.internalMetadata.kind === 'empty-slot') {
        return {
            id: crypto.randomUUID(),
            kind: "empty-slot",
            parent: parentViewNode
        };
    }
    // if (renderNode.internalMetadata.kind === 'empty-slot') {
    // 	const id = crypto.randomUUID();
    // 	const newViewNode: ReactViewTreeNode = {
    // 		id,
    // 		kind: "real-element",
    // 		childNodes: [],
    // 		metadata: renderNode.internalMetadata,
    // 		parent: parentViewNode,
    // 		indexPath: [],
    // 	}
    // 	renderNode.computedViewTreeNodeId = id;
    // 	newViewNode.childNodes.push({
    // 		kind: 'empty-slot',
    // 		id: crypto.randomUUID(),
    // 		parent: newViewNode
    // 	});
    // 	return newViewNode;
    // }
    const newViewNode = {
        id: crypto.randomUUID(),
        kind: "real-element",
        childNodes: [],
        indexPath: renderNode.indexPath,
        metadata: renderNode.internalMetadata,
        parent: parentViewNode
    };
    renderNode.computedViewTreeNodeId = newViewNode.id;
    switch (renderNode.internalMetadata.component.kind) {
        case 'function': {
            const childrenProp = renderNode.internalMetadata.children.length > 0
                ? { children: renderNode.internalMetadata.children }
                : false;
            currentTreeRef.renderTree.currentLocalHookOrder = 0;
            currentTreeRef.renderTree.currentlyRendering = renderNode;
            const props = renderNode.internalMetadata.props;
            const internalMetadata = renderNode.internalMetadata.component.function({
                ...props,
                ...childrenProp
            });
            const newChildRenderNodes = generateRenderNodeChildNodes({
                internalMetadata,
                parentRenderNode: renderNode,
            });
            const reconciledChildRenderNodes = reconcileChildRenderNodes({
                oldChildRenderNodes: renderNode.childNodes,
                newChildRenderNodes,
            });
            const nextNodeToProcess = reconciledChildRenderNodes.find(node => {
                if (node.kind === 'empty-slot') {
                    return false;
                }
                return node.indexPath.length === 0;
            }) ?? { kind: "empty-slot", parent: renderNode };
            renderNode.childNodes = reconciledChildRenderNodes;
            ;
            renderNode.hasRendered = true;
            const viewNode = generateReactTreesHelper({
                renderNode: nextNodeToProcess,
                parentViewNode: newViewNode,
                startingFromRenderNodeId,
                // isEntryPoint
            });
            if (!viewNode) {
                break;
            }
            newViewNode.childNodes.push(viewNode);
            break;
        }
        case "tag": {
            const fullyComputedChildren = renderNode.internalMetadata.children.map((child) => {
                if (!currentTreeRef.renderTree) {
                    throw new Error('Invariant Error: Tag trying to render outside render tree');
                }
                if (child.kind === 'empty-slot') {
                    return {
                        renderNode: { kind: 'empty-slot', parent: renderNode },
                        viewNode: {
                            kind: 'empty-slot',
                            id: crypto.randomUUID(),
                            parent: newViewNode
                        },
                    };
                }
                const parentRenderNode = findExistingRenderNodeOrThrow((node) => {
                    if (node.kind === "empty-slot") {
                        return false;
                    }
                    if (node.internalMetadata.kind === "empty-slot") {
                        return false;
                    }
                    return node.id === startingFromRenderNodeId;
                }, currentTreeRef.renderTree.root);
                if (!parentRenderNode) {
                    throw new Error('Invariant Error: It implies child element has not parent!');
                }
                if (parentRenderNode.kind === 'empty-slot' ||
                    parentRenderNode.internalMetadata.kind === 'empty-slot') {
                    throw new Error('Invariant Error: It implies empty-slot element generated child node');
                }
                const existingRenderNode = findExistingRenderNodeOrThrow((node) => {
                    if (node.kind === 'empty-slot' ||
                        node.internalMetadata.kind === 'empty-slot') {
                        return false;
                    }
                    return node.internalMetadata.id === child.id;
                }, parentRenderNode);
                if (existingRenderNode.kind === 'empty-slot') {
                    return {
                        renderNode: { kind: 'empty-slot', parent: renderNode },
                        viewNode: {
                            kind: 'empty-slot',
                            id: crypto.randomUUID(),
                            parent: newViewNode
                        },
                    };
                }
                const reRenderChild = () => {
                    const viewNode = generateReactTreesHelper({
                        renderNode: existingRenderNode,
                        parentViewNode: newViewNode,
                        startingFromRenderNodeId
                    });
                    return {
                        viewNode,
                        renderNode: existingRenderNode
                    };
                };
                if (!currentTreeRef.viewTree) {
                    return reRenderChild();
                }
                const existingViewNode = currentTreeRef.viewTree.root &&
                    existingRenderNode.computedViewTreeNodeId
                    ? findExistingViewNodeOrThrow((node) => node.id === existingRenderNode.computedViewTreeNodeId, currentTreeRef.viewTree.root)
                    : null;
                if (!existingViewNode) {
                    return reRenderChild();
                }
                const shouldReRender = isChildOf({
                    potentialChildId: child.id,
                    potentialParentId: parentRenderNode.internalMetadata.id,
                });
                if (shouldReRender) {
                    return reRenderChild();
                }
                return {
                    viewNode: existingViewNode,
                    renderNode: existingRenderNode
                };
            });
            newViewNode.childNodes = fullyComputedChildren
                .map(({ viewNode }) => viewNode)
                .filter(viewNode => viewNode);
            break;
        }
    }
    return newViewNode;
}
function generateReactTrees(renderNode, parentViewNode) {
    if (renderNode.kind === 'empty-slot') {
        return {
            id: crypto.randomUUID(),
            kind: 'empty-slot',
            parent: parentViewNode
        };
    }
    const newViewTree = generateReactTreesHelper({
        renderNode,
        parentViewNode,
        startingFromRenderNodeId: renderNode.id,
        // isEntryPoint: true,
    });
    return newViewTree;
}
function buildReactTrees(internalMetadata) {
    const rootRenderTreeNode = {
        id: crypto.randomUUID(),
        kind: "real-element",
        childNodes: [],
        computedViewTreeNodeId: null,
        internalMetadata: {
            id: crypto.randomUUID(),
            kind: 'real-element',
            component: {
                kind: 'function',
                function: () => internalMetadata,
                name: 'root'
            },
            children: [],
            props: {}
        },
        indexPath: [],
        hasRendered: false,
        parent: null
    };
    currentTreeRef.renderTree = {
        root: rootRenderTreeNode,
        currentLocalHookOrder: 0,
        currentlyRendering: null
    };
    console.log('------Rendering Start------');
    const viewTree = generateReactTrees(rootRenderTreeNode, null);
    currentTreeRef.viewTree = {
        root: viewTree
    };
    console.log('------Rendering End------');
    return {
        viewTree: currentTreeRef.viewTree,
        renderTree: currentTreeRef.renderTree
    };
}
export function render(internalMetadata, rootElement) {
    const { viewTree, renderTree } = buildReactTrees(internalMetadata);
    console.log('viewTree ', viewTree);
    console.log('renderTree ', renderTree);
}
