import { currentTreeRef } from './core';
export const run = (f) => f();
export const deepCloneTree = (obj, seen = new WeakSet()) => {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }
    if (obj instanceof HTMLElement) {
        return obj;
    }
    if (typeof obj === "function") {
        return obj.bind({});
    }
    if (seen.has(obj)) {
        return obj; //
    }
    seen.add(obj);
    const copy = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            copy[key] = deepCloneTree(obj[key], seen);
        }
    }
    seen.delete(obj);
    return copy;
};
export const deepEqual = (a, b) => {
    if (a === b)
        return true;
    if (a && b && typeof a === "object" && typeof b === "object") {
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length)
                return false;
            for (let i = 0; i < a.length; i++) {
                if (!deepEqual(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
        if (a.constructor !== b.constructor) {
            return false;
        }
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) {
            return false;
        }
        for (const key of keysA) {
            if (!keysB.includes(key)) {
                return false;
            }
            if (!deepEqual(a[key], b[key])) {
                return false;
            }
        }
        return true;
    }
    return false;
};
export function deepTraverseAndModify(obj) {
    if (Array.isArray(obj)) {
        return obj.map(deepTraverseAndModify);
    }
    else if (typeof obj === "object" && obj !== null) {
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
            if (key === "computedViewTreeNode" &&
                value &&
                typeof value === "object" &&
                "id" in value) {
                newObj["computedViewTreeNodeId"] = value.id;
            }
            else if (key === "internalMetadata" &&
                value &&
                typeof value === "object" &&
                "id" in value) {
                let x = value;
                newObj["internalMetadataName+Id"] = (x.component.tagName +
                    x.component.name +
                    "-" +
                    x.id.slice(0, 4)).replace("undefined", "");
            }
            else {
                newObj[key] = deepTraverseAndModify(value);
            }
        }
        return newObj;
    }
    return obj;
}
export const isChildOf = ({ potentialChildId, potentialParentId, }) => {
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
};
export const compareIndexPaths = (leftIndexPath, rightIndexPath) => {
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
};
export const getComponentName = (internalMetadata) => {
    return run(() => {
        if (internalMetadata.kind === "empty-slot") {
            return "empty-slot";
        }
        switch (internalMetadata.component.kind) {
            case "function": {
                return internalMetadata.component.function.name;
            }
            case "tag": {
                return internalMetadata.component.tagName;
            }
        }
    });
};
