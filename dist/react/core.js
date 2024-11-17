import * as Utils from "../utils";
export * from "./hooks";
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
        provider: null,
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
export const currentTreeRef = {
    viewTree: null,
    renderTree: null,
    defaultContextState: [],
    tempViewNodes: []
};
function updateElement({ props, tagComponent, previousDomRef, lastParent, insertedBefore, }) {
    if (previousDomRef) {
        Object.assign(previousDomRef, props);
        previousDomRef.style.cssText =
            typeof props?.['style'] === "string" ? props?.['style'] : "";
        tagComponent.domRef = previousDomRef;
        return previousDomRef;
    }
    const newEl = document.createElement(tagComponent.tagName);
    Object.assign(newEl, props);
    if (insertedBefore && !lastParent.contains(insertedBefore)) {
        throw new Error("Invariant, cannot ask update dom to place a node before a non-sibling");
    }
    if (insertedBefore) {
        lastParent.insertBefore(newEl, insertedBefore.nextSibling);
        tagComponent.domRef = newEl;
        return newEl;
    }
    lastParent.appendChild(newEl);
    tagComponent.domRef = newEl;
    return newEl;
}
function findFirstTagNode(viewNode) {
    if (viewNode.kind === "empty-slot") {
        return null;
    }
    if (viewNode.metadata.kind === "empty-slot") {
        return null;
    }
    switch (viewNode.metadata.component.kind) {
        case "function": {
            return findFirstTagNode(viewNode.childNodes[0]);
        }
        case "tag": {
            return {
                component: viewNode.metadata.component,
                viewNode,
            };
        }
    }
}
export function updateDom({ oldViewTree, newViewTree, insertInfo }) {
    const aux = ({ oldViewTree, newViewTree, parentDomNode, lastUpdatedSibling }) => {
        if (!newViewTree ||
            newViewTree.kind === 'empty-slot' ||
            newViewTree.metadata.kind === 'empty-slot') {
            if (!oldViewTree) {
                return { lastUpdated: null };
            }
            if (oldViewTree.kind === 'empty-slot' ||
                oldViewTree.metadata.kind === 'empty-slot') {
                return { lastUpdated: null };
            }
            const tagNode = findFirstTagNode(oldViewTree);
            tagNode?.component.domRef?.parentElement?.removeChild(tagNode.component.domRef);
            return { lastUpdated: null };
        }
        if (!oldViewTree ||
            oldViewTree.kind === 'empty-slot' ||
            oldViewTree.metadata.kind === 'empty-slot') {
            switch (newViewTree.metadata.component.kind) {
                case "function": {
                    const auxResult = aux({
                        lastUpdatedSibling: lastUpdatedSibling,
                        newViewTree: findFirstTagNode(newViewTree)?.viewNode ?? null,
                        oldViewTree: null,
                        parentDomNode: parentDomNode,
                    });
                    return { lastUpdated: auxResult.lastUpdated };
                }
                case "tag": {
                    const updatedElement = updateElement({
                        insertedBefore: lastUpdatedSibling,
                        lastParent: parentDomNode,
                        previousDomRef: null,
                        props: newViewTree.metadata.props,
                        tagComponent: newViewTree.metadata.component,
                    });
                    newViewTree.childNodes.forEach((newChildNode) => {
                        aux({
                            lastUpdatedSibling: null,
                            newViewTree: newChildNode,
                            oldViewTree: null,
                            parentDomNode: updatedElement,
                        });
                    });
                    return { lastUpdated: updatedElement };
                }
            }
        }
        switch (newViewTree.metadata.component.kind) {
            case "function": {
                const auxResult = aux({
                    lastUpdatedSibling: lastUpdatedSibling,
                    newViewTree: findFirstTagNode(newViewTree)?.viewNode ?? null,
                    oldViewTree: findFirstTagNode(oldViewTree)?.viewNode ?? null,
                    parentDomNode: parentDomNode,
                });
                return {
                    lastUpdated: auxResult.lastUpdated,
                };
            }
            case "tag":
                {
                    switch (oldViewTree.metadata.component.kind) {
                        case "function": {
                            const auxResult = aux({
                                lastUpdatedSibling: lastUpdatedSibling,
                                newViewTree: newViewTree,
                                oldViewTree: oldViewTree.childNodes[0],
                                parentDomNode: parentDomNode,
                            });
                            return { lastUpdated: auxResult.lastUpdated };
                        }
                        case "tag": {
                            const lastUpdated = Utils.run(() => {
                                if (!(oldViewTree.metadata.kind === "real-element") ||
                                    !(newViewTree.metadata.kind === "real-element")) {
                                    throw new Error("No longer a non escaping function");
                                }
                                if (!(oldViewTree.metadata.component.kind === "tag") ||
                                    !(newViewTree.metadata.component.kind === "tag")) {
                                    throw new Error("No longer a non-escaping closure");
                                }
                                if (!Utils.deepEqual(oldViewTree.metadata.props, newViewTree.metadata.props) ||
                                    oldViewTree.metadata.component.tagName !==
                                        newViewTree.metadata.component.tagName) {
                                    return updateElement({
                                        insertedBefore: lastUpdatedSibling,
                                        lastParent: parentDomNode,
                                        previousDomRef: oldViewTree.metadata.component.domRef,
                                        props: newViewTree.metadata.props,
                                        tagComponent: newViewTree.metadata.component,
                                    });
                                }
                                newViewTree.metadata.component.domRef =
                                    oldViewTree.metadata.component.domRef;
                                return oldViewTree.metadata.component.domRef;
                            });
                            let trackedLastUpdatedSibling = null;
                            // handles deleting any extra nodes from the previous tree not associated with a new view tree node
                            oldViewTree.childNodes.forEach((oldNode, index) => {
                                if (index < newViewTree.childNodes.length) {
                                    return;
                                }
                                aux({
                                    parentDomNode: lastUpdated,
                                    lastUpdatedSibling: trackedLastUpdatedSibling,
                                    newViewTree: null,
                                    oldViewTree: oldNode,
                                });
                            });
                            // handles adding any extra nodes that appeared in the new view tree
                            newViewTree.childNodes.forEach((newNode, index) => {
                                const associatedWith = oldViewTree.childNodes.at(index);
                                // we do care about the return result since it may add to the dom
                                const auxResult = aux({
                                    lastUpdatedSibling: trackedLastUpdatedSibling,
                                    newViewTree: newNode,
                                    oldViewTree: associatedWith ?? null,
                                    parentDomNode: lastUpdated,
                                });
                                // incase it didn't add anything (e.g. the new node was a slot), we want to not destroy the last sibling
                                trackedLastUpdatedSibling =
                                    auxResult.lastUpdated ?? trackedLastUpdatedSibling;
                            });
                            return { lastUpdated: lastUpdated };
                        }
                    }
                }
        }
    };
    switch (insertInfo.kind) {
        case 'root': {
            aux({
                oldViewTree,
                newViewTree,
                parentDomNode: insertInfo.root,
                lastUpdatedSibling: null
            });
            return;
        }
        case "child":
            {
                if (!currentTreeRef.viewTree) {
                    throw new Error("Invariant error, cannot reconcile child without a view tree setup");
                }
                const previousChild = insertInfo.previousViewTreeParent.kind === "empty-slot"
                    ? null
                    : insertInfo.previousViewTreeParent?.childNodes.reduce((prev, _, index) => {
                        if (!(insertInfo.kind === "child") ||
                            insertInfo.previousViewTreeParent.kind === "empty-slot") {
                            throw new Error("No longer a non escaping closure, unsafe access");
                        }
                        const nextSibling = insertInfo.previousViewTreeParent.childNodes.at(index + 1);
                        if (nextSibling) {
                            return nextSibling;
                        }
                        return prev;
                    }, null);
                const tagNode = previousChild ? findFirstTagNode(previousChild) : null;
                if (tagNode && !tagNode.component.domRef) {
                    throw new Error("Invariant Error: Previous view tree must always have dom nodes on tags");
                }
                if (tagNode && !tagNode.component.domRef.parentElement) {
                    throw new Error("Invariant Error: Attempting to update a detached dom node");
                }
                const parentTagNode = findFirstTagNode(insertInfo.previousViewTreeParent);
                if (!parentTagNode) {
                    throw new Error("Invariant Error: A parent node could not have been an empty slot since we know it has view node children");
                }
                if (!parentTagNode.component.domRef) {
                    throw new Error("Invariant Error: Previous view tree must always have dom nodes on tags");
                }
                aux({
                    lastUpdatedSibling: tagNode?.component.domRef ?? null,
                    // lastUpdatedSibling: null,
                    newViewTree: newViewTree,
                    oldViewTree: oldViewTree,
                    parentDomNode: parentTagNode.component.domRef,
                });
            }
            return;
    }
}
export function searchForContextStateUpwards(viewNode, ctxId) {
    if (viewNode.parent === null) {
        const defaultContext = currentTreeRef.defaultContextState.find((ctx) => ctx.contextId === ctxId);
        if (!defaultContext) {
            throw new Error("Invalid ctxId, not created by createContext");
        }
        return defaultContext.state;
    }
    // console.log("searching up on", viewNode, ctxId);
    if (viewNode.kind === "empty-slot") {
        return searchForContextStateUpwards(viewNode.parent, ctxId);
    }
    if (viewNode.metadata.kind === "empty-slot") {
        return searchForContextStateUpwards(viewNode.parent, ctxId);
    }
    if (viewNode.metadata.provider?.contextId === ctxId) {
        return viewNode.metadata.provider.state;
    }
    return searchForContextStateUpwards(viewNode.parent, ctxId);
}
;
export function triggerReRender(renderNode) {
    if (!currentTreeRef.renderTree) {
        throw new Error('Cannot Re-Render node without render tree!');
    }
    if (!renderNode.computedViewTreeNodeId) {
        throw new Error('Cannot Re-Render unmounted component');
    }
    if (!currentTreeRef.viewTree) {
        throw new Error('Cannot Re-Render node without view tree!');
    }
    const existingParentViewNode = findParentViewNode(renderNode.computedViewTreeNodeId);
    if (existingParentViewNode.kind === 'empty-slot') {
        throw new Error('Invariant Error: Empty slot cannot have children');
    }
    const clonedParentViewNode = Utils.deepCloneTree(existingParentViewNode);
    const previousViewTree = clonedParentViewNode.childNodes.find(node => node.id === renderNode.computedViewTreeNodeId);
    console.log("RE-RENDER START----------------------------------------------");
    const regeneratedViewTree = generateReactTrees(renderNode, clonedParentViewNode);
    console.log("RE-RENDER END----------------------------------------------");
    const index = existingParentViewNode.childNodes.findIndex((node) => renderNode.internalMetadata.kind === "empty-slot" ||
        node.kind === "empty-slot" ||
        node.metadata.kind === "empty-slot"
        ? false
        : renderNode.internalMetadata.id ===
            node.metadata.id);
    // if (index === -1 && renderNode.internalMetadata.kind !== "empty-slot") {
    // 	throw new Error('Invariant Error: View Node not found in parent view node');
    // }
    // if (
    // 	currentTreeRef.renderTree.root.kind === "empty-slot" &&
    // 	regeneratedViewTree
    // ) {
    // 	throw new Error(
    // 		"Invariant Error: This implies an empty slot generated a not null view tree"
    // 	);
    // }
    // existingParentViewNode.childNodes[index] = regeneratedViewTree;
    if (!existingParentViewNode || index === undefined || index === -1) {
        if (currentTreeRef.renderTree.root.kind === "empty-slot" &&
            regeneratedViewTree) {
            throw new Error("Invariant Error: This implies an empty slot generated a not null view tree");
        }
        // should not do an upper mutate here...
        currentTreeRef.viewTree.root = regeneratedViewTree;
        if (currentTreeRef.renderTree.root.kind === "real-element") {
            currentTreeRef.renderTree.root.computedViewTreeNodeId =
                regeneratedViewTree?.id ?? null;
        }
    }
    else {
        existingParentViewNode.childNodes[index] = regeneratedViewTree;
    }
    updateDom({
        newViewTree: regeneratedViewTree,
        oldViewTree: previousViewTree,
        insertInfo: {
            kind: "child",
            previousViewTreeParent: clonedParentViewNode, // the root has no parent, so this is the only valid case, but may cause weird bugs if something was calculated weirdly
        },
    });
}
// export const triggerReRender = (
// 	capturedCurrentlyRenderingRenderNode: ReactRenderTreeNodeRealElement
// ) => {
// 	if (!capturedCurrentlyRenderingRenderNode.computedViewTreeNodeId) {
// 		throw new Error(
// 			"Invariant: set state trying to re-render unmounted component"
// 		);
// 	}
// 	if (!currentTreeRef.viewTree || !currentTreeRef.renderTree) {
// 		throw new Error("Invariant error, no view tree or no render tree");
// 	}
// 	const parentNode = findParentViewNode(
// 		capturedCurrentlyRenderingRenderNode.computedViewTreeNodeId
// 	);
// 	if (parentNode.kind === "empty-slot") {
// 		throw new Error("Invariant Error: An empty slot cannot have any children");
// 	}
// 	const clonedParentNode = Utils.deepCloneTree(parentNode);
// 	console.log("\n\nRENDER START----------------------------------------------");
// 	const previousViewTree =
// 		clonedParentNode?.childNodes.find(
// 			(node) =>
// 				node.id === capturedCurrentlyRenderingRenderNode.computedViewTreeNodeId
// 		) ?? currentTreeRef.viewTree.root;
// 	const reGeneratedViewTree = generateReactTrees(
// 		capturedCurrentlyRenderingRenderNode,
// 		parentNode,
// 	);
// 	console.log("RENDER END----------------------------------------------\n\n");
// 	// its a detached node and because of that we set it as the root
// 	const index = parentNode.childNodes.findIndex(
// 		(node) =>
// 			capturedCurrentlyRenderingRenderNode.internalMetadata.kind ===
// 				"empty-slot" ||
// 				node.kind === "empty-slot" ||
// 				node.metadata.kind === "empty-slot"
// 				? false
// 				: capturedCurrentlyRenderingRenderNode.internalMetadata.id ===
// 				node.metadata.id // changes this might be dangerous, but no idea why we used the key before
// 	);
// 	// this will always be in the parent nodes children (or is root)
// 	// because we re-rendered at capturedCurrentlyRenderingRenderNode,
// 	// so the previous parent must contain it
// 	// we can now update the view tree by replacing by component
// 	// equality (lets go keys)
// 	if (!parentNode || index === undefined || index === -1) {
// 		if (
// 			currentTreeRef.renderTree.root.kind === "empty-slot" &&
// 			reGeneratedViewTree
// 		) {
// 			throw new Error(
// 				"Invariant Error: This implies an empty slot generated a not null view tree"
// 			);
// 		}
// 		// should not do an upper mutate here...
// 		currentTreeRef.viewTree.root = reGeneratedViewTree;
// 		if (currentTreeRef.renderTree.root.kind === "real-element") {
// 			currentTreeRef.renderTree.root.computedViewTreeNodeId =
// 				reGeneratedViewTree?.id ?? null;
// 		}
// 	} else {
// 		parentNode.childNodes[index] = reGeneratedViewTree;
// 	}
// 	updateDom({
// 		newViewTree: reGeneratedViewTree,
// 		oldViewTree: previousViewTree,
// 		insertInfo: {
// 			kind: "child",
// 			previousViewTreeParent: clonedParentNode, // the root has no parent, so this is the only valid case, but may cause weird bugs if something was calculated weirdly
// 		},
// 	});
// };
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
function findParentViewNode(id) {
    const aux = (viewNode) => {
        if (viewNode.kind === "empty-slot") {
            return;
        }
        for (const node of viewNode.childNodes) {
            if (node.id === id) {
                return viewNode;
            }
            const res = aux(node);
            if (res) {
                return res;
            }
        }
    };
    if (currentTreeRef.viewTree?.root?.id === id) {
        return currentTreeRef.viewTree.root;
    }
    const result = aux(currentTreeRef.viewTree?.root);
    if (!result) {
        throw new Error("detached node or wrong id:" + id + "\n\n");
    }
    return result;
}
;
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
            hooks: [],
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
    currentTreeRef.tempViewNodes.push(newViewNode);
    switch (renderNode.internalMetadata.component.kind) {
        case 'function': {
            const childrenProp = renderNode.internalMetadata.children.length > 0
                ? { children: renderNode.internalMetadata.children }
                : false;
            currentTreeRef.renderTree.currentLocalHookOrder = 0;
            currentTreeRef.renderTree.currentlyRendering = renderNode;
            const previousRenderEffects = renderNode.hooks
                .filter((hook) => hook.kind === "effect")
                .map((hook) => hook.deps);
            const hasRendered = renderNode.hasRendered;
            const props = renderNode.internalMetadata.props;
            const internalMetadata = renderNode.internalMetadata.component.function({
                ...props,
                ...childrenProp
            });
            const currentRenderEffects = renderNode.hooks
                .filter((hook) => hook.kind === "effect");
            currentRenderEffects.forEach((effect, index) => {
                const didDepsChange = Utils.run(() => {
                    if (!hasRendered) {
                        return true;
                    }
                    const currentDeps = effect.deps;
                    const previousDeps = previousRenderEffects[index];
                    if (currentDeps.length !== previousDeps.length) {
                        return true;
                    }
                    return !currentDeps.every((dep, index) => {
                        const previousDep = previousDeps[index];
                        return dep === previousDep;
                    });
                });
                if (didDepsChange) {
                    effect.cleanup?.();
                    const cleanup = effect.cb();
                    if (typeof cleanup === "function") {
                        effect.cleanup = () => cleanup();
                    }
                }
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
    currentTreeRef.tempViewNodes = [];
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
            props: {},
            provider: null
        },
        indexPath: [],
        hooks: [],
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
    const { viewTree } = buildReactTrees(internalMetadata);
    updateDom({
        newViewTree: viewTree.root,
        oldViewTree: null,
        insertInfo: {
            kind: "root",
            root: rootElement
        }
    });
}
