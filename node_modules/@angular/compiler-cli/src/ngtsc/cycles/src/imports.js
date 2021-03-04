/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/cycles/src/imports", ["require", "exports", "tslib", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ImportGraph = void 0;
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    /**
     * A cached graph of imports in the `ts.Program`.
     *
     * The `ImportGraph` keeps track of dependencies (imports) of individual `ts.SourceFile`s. Only
     * dependencies within the same program are tracked; imports into packages on NPM are not.
     */
    var ImportGraph = /** @class */ (function () {
        function ImportGraph(resolver) {
            this.resolver = resolver;
            this.map = new Map();
        }
        /**
         * List the direct (not transitive) imports of a given `ts.SourceFile`.
         *
         * This operation is cached.
         */
        ImportGraph.prototype.importsOf = function (sf) {
            if (!this.map.has(sf)) {
                this.map.set(sf, this.scanImports(sf));
            }
            return this.map.get(sf);
        };
        /**
         * Lists the transitive imports of a given `ts.SourceFile`.
         */
        ImportGraph.prototype.transitiveImportsOf = function (sf) {
            var imports = new Set();
            this.transitiveImportsOfHelper(sf, imports);
            return imports;
        };
        ImportGraph.prototype.transitiveImportsOfHelper = function (sf, results) {
            var _this = this;
            if (results.has(sf)) {
                return;
            }
            results.add(sf);
            this.importsOf(sf).forEach(function (imported) {
                _this.transitiveImportsOfHelper(imported, results);
            });
        };
        /**
         * Find an import path from the `start` SourceFile to the `end` SourceFile.
         *
         * This function implements a breadth first search that results in finding the
         * shortest path between the `start` and `end` points.
         *
         * @param start the starting point of the path.
         * @param end the ending point of the path.
         * @returns an array of source files that connect the `start` and `end` source files, or `null` if
         *     no path could be found.
         */
        ImportGraph.prototype.findPath = function (start, end) {
            var e_1, _a;
            if (start === end) {
                // Escape early for the case where `start` and `end` are the same.
                return [start];
            }
            var found = new Set([start]);
            var queue = [new Found(start, null)];
            while (queue.length > 0) {
                var current = queue.shift();
                var imports = this.importsOf(current.sourceFile);
                try {
                    for (var imports_1 = (e_1 = void 0, tslib_1.__values(imports)), imports_1_1 = imports_1.next(); !imports_1_1.done; imports_1_1 = imports_1.next()) {
                        var importedFile = imports_1_1.value;
                        if (!found.has(importedFile)) {
                            var next = new Found(importedFile, current);
                            if (next.sourceFile === end) {
                                // We have hit the target `end` path so we can stop here.
                                return next.toPath();
                            }
                            found.add(importedFile);
                            queue.push(next);
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (imports_1_1 && !imports_1_1.done && (_a = imports_1.return)) _a.call(imports_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            return null;
        };
        /**
         * Add a record of an import from `sf` to `imported`, that's not present in the original
         * `ts.Program` but will be remembered by the `ImportGraph`.
         */
        ImportGraph.prototype.addSyntheticImport = function (sf, imported) {
            if (isLocalFile(imported)) {
                this.importsOf(sf).add(imported);
            }
        };
        ImportGraph.prototype.scanImports = function (sf) {
            var _this = this;
            var imports = new Set();
            // Look through the source file for import statements.
            sf.statements.forEach(function (stmt) {
                if ((ts.isImportDeclaration(stmt) || ts.isExportDeclaration(stmt)) &&
                    stmt.moduleSpecifier !== undefined && ts.isStringLiteral(stmt.moduleSpecifier)) {
                    // Resolve the module to a file, and check whether that file is in the ts.Program.
                    var moduleName = stmt.moduleSpecifier.text;
                    var moduleFile = _this.resolver.resolveModule(moduleName, sf.fileName);
                    if (moduleFile !== null && isLocalFile(moduleFile)) {
                        // Record this local import.
                        imports.add(moduleFile);
                    }
                }
            });
            return imports;
        };
        return ImportGraph;
    }());
    exports.ImportGraph = ImportGraph;
    function isLocalFile(sf) {
        return !sf.fileName.endsWith('.d.ts');
    }
    /**
     * A helper class to track which SourceFiles are being processed when searching for a path in
     * `getPath()` above.
     */
    var Found = /** @class */ (function () {
        function Found(sourceFile, parent) {
            this.sourceFile = sourceFile;
            this.parent = parent;
        }
        /**
         * Back track through this found SourceFile and its ancestors to generate an array of
         * SourceFiles that form am import path between two SourceFiles.
         */
        Found.prototype.toPath = function () {
            var array = [];
            var current = this;
            while (current !== null) {
                array.push(current.sourceFile);
                current = current.parent;
            }
            // Pushing and then reversing, O(n), rather than unshifting repeatedly, O(n^2), avoids
            // manipulating the array on every iteration: https://stackoverflow.com/a/26370620
            return array.reverse();
        };
        return Found;
    }());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvY3ljbGVzL3NyYy9pbXBvcnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7SUFFSCwrQkFBaUM7SUFJakM7Ozs7O09BS0c7SUFDSDtRQUdFLHFCQUFvQixRQUF3QjtZQUF4QixhQUFRLEdBQVIsUUFBUSxDQUFnQjtZQUZwQyxRQUFHLEdBQUcsSUFBSSxHQUFHLEVBQXFDLENBQUM7UUFFWixDQUFDO1FBRWhEOzs7O1dBSUc7UUFDSCwrQkFBUyxHQUFULFVBQVUsRUFBaUI7WUFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNyQixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ3hDO1lBQ0QsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQ7O1dBRUc7UUFDSCx5Q0FBbUIsR0FBbkIsVUFBb0IsRUFBaUI7WUFDbkMsSUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQWlCLENBQUM7WUFDekMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM1QyxPQUFPLE9BQU8sQ0FBQztRQUNqQixDQUFDO1FBRU8sK0NBQXlCLEdBQWpDLFVBQWtDLEVBQWlCLEVBQUUsT0FBMkI7WUFBaEYsaUJBUUM7WUFQQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ25CLE9BQU87YUFDUjtZQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENB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SCxPQUFPLE9BQU8sQ0FBQztRQUNqQixDQUFDO1FBQ0gsa0JBQUM7SUFBRCxDQUFDLEFBckdELElBcUdDO0lBckdZLGtDQUFXO0lBdUd4QixTQUFTLFdBQVcsQ0FBQyxFQUFpQjtRQUNwQyxPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVEOzs7T0FHRztJQUNIO1FBQ0UsZUFBcUIsVUFBeUIsRUFBVyxNQUFrQjtZQUF0RCxlQUFVLEdBQVYsVUFBVSxDQUFlO1lBQVcsV0FBTSxHQUFOLE1BQU0sQ0FBWTtRQUFHLENBQUM7UUFFL0U7OztXQUdHO1FBQ0gsc0JBQU0sR0FBTjtZQUNFLElBQU0sS0FBSyxHQUFvQixFQUFFLENBQUM7WUFDbEMsSUFBSSxPQUFPLEdBQWUsSUFBSSxDQUFDO1lBQy9CLE9BQU8sT0FBTyxLQUFLLElBQUksRUFBRTtnQkFDdkIsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQy9CLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO2FBQzFCO1lBQ0Qsc0ZBQXNGO1lBQ3RGLGtGQUFrRjtZQUNsRixPQUFPLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBQ0gsWUFBQztJQUFELENBQUMsQUFsQkQsSUFrQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7TW9kdWxlUmVzb2x2ZXJ9IGZyb20gJy4uLy4uL2ltcG9ydHMnO1xuXG4vKipcbiAqIEEgY2FjaGVkIGdyYXBoIG9mIGltcG9ydHMgaW4gdGhlIGB0cy5Qcm9ncmFtYC5cbiAqXG4gKiBUaGUgYEltcG9ydEdyYXBoYCBrZWVwcyB0cmFjayBvZiBkZXBlbmRlbmNpZXMgKGltcG9ydHMpIG9mIGluZGl2aWR1YWwgYHRzLlNvdXJjZUZpbGVgcy4gT25seVxuICogZGVwZW5kZW5jaWVzIHdpdGhpbiB0aGUgc2FtZSBwcm9ncmFtIGFyZSB0cmFja2VkOyBpbXBvcnRzIGludG8gcGFja2FnZXMgb24gTlBNIGFyZSBub3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBJbXBvcnRHcmFwaCB7XG4gIHByaXZhdGUgbWFwID0gbmV3IE1hcDx0cy5Tb3VyY2VGaWxlLCBTZXQ8dHMuU291cmNlRmlsZT4+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZXNvbHZlcjogTW9kdWxlUmVzb2x2ZXIpIHt9XG5cbiAgLyoqXG4gICAqIExpc3QgdGhlIGRpcmVjdCAobm90IHRyYW5zaXRpdmUpIGltcG9ydHMgb2YgYSBnaXZlbiBgdHMuU291cmNlRmlsZWAuXG4gICAqXG4gICAqIFRoaXMgb3BlcmF0aW9uIGlzIGNhY2hlZC5cbiAgICovXG4gIGltcG9ydHNPZihzZjogdHMuU291cmNlRmlsZSk6IFNldDx0cy5Tb3VyY2VGaWxlPiB7XG4gICAgaWYgKCF0aGlzLm1hcC5oYXMoc2YpKSB7XG4gICAgICB0aGlzLm1hcC5zZXQoc2YsIHRoaXMuc2NhbkltcG9ydHMoc2YpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFwLmdldChzZikhO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3RzIHRoZSB0cmFuc2l0aXZlIGltcG9ydHMgb2YgYSBnaXZlbiBgdHMuU291cmNlRmlsZWAuXG4gICAqL1xuICB0cmFuc2l0aXZlSW1wb3J0c09mKHNmOiB0cy5Tb3VyY2VGaWxlKTogU2V0PHRzLlNvdXJjZUZpbGU+IHtcbiAgICBjb25zdCBpbXBvcnRzID0gbmV3IFNldDx0cy5Tb3VyY2VGaWxlPigpO1xuICAgIHRoaXMudHJhbnNpdGl2ZUltcG9ydHNPZkhlbHBlcihzZiwgaW1wb3J0cyk7XG4gICAgcmV0dXJuIGltcG9ydHM7XG4gIH1cblxuICBwcml2YXRlIHRyYW5zaXRpdmVJbXBvcnRzT2ZIZWxwZXIoc2Y6IHRzLlNvdXJjZUZpbGUsIHJlc3VsdHM6IFNldDx0cy5Tb3VyY2VGaWxlPik6IHZvaWQge1xuICAgIGlmIChyZXN1bHRzLmhhcyhzZikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVzdWx0cy5hZGQoc2YpO1xuICAgIHRoaXMuaW1wb3J0c09mKHNmKS5mb3JFYWNoKGltcG9ydGVkID0+IHtcbiAgICAgIHRoaXMudHJhbnNpdGl2ZUltcG9ydHNPZkhlbHBlcihpbXBvcnRlZCwgcmVzdWx0cyk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmluZCBhbiBpbXBvcnQgcGF0aCBmcm9tIHRoZSBgc3RhcnRgIFNvdXJjZUZpbGUgdG8gdGhlIGBlbmRgIFNvdXJjZUZpbGUuXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gaW1wbGVtZW50cyBhIGJyZWFkdGggZmlyc3Qgc2VhcmNoIHRoYXQgcmVzdWx0cyBpbiBmaW5kaW5nIHRoZVxuICAgKiBzaG9ydGVzdCBwYXRoIGJldHdlZW4gdGhlIGBzdGFydGAgYW5kIGBlbmRgIHBvaW50cy5cbiAgICpcbiAgICogQHBhcmFtIHN0YXJ0IHRoZSBzdGFydGluZyBwb2ludCBvZiB0aGUgcGF0aC5cbiAgICogQHBhcmFtIGVuZCB0aGUgZW5kaW5nIHBvaW50IG9mIHRoZSBwYXRoLlxuICAgKiBAcmV0dXJucyBhbiBhcnJheSBvZiBzb3VyY2UgZmlsZXMgdGhhdCBjb25uZWN0IHRoZSBgc3RhcnRgIGFuZCBgZW5kYCBzb3VyY2UgZmlsZXMsIG9yIGBudWxsYCBpZlxuICAgKiAgICAgbm8gcGF0aCBjb3VsZCBiZSBmb3VuZC5cbiAgICovXG4gIGZpbmRQYXRoKHN0YXJ0OiB0cy5Tb3VyY2VGaWxlLCBlbmQ6IHRzLlNvdXJjZUZpbGUpOiB0cy5Tb3VyY2VGaWxlW118bnVsbCB7XG4gICAgaWYgKHN0YXJ0ID09PSBlbmQpIHtcbiAgICAgIC8vIEVzY2FwZSBlYXJseSBmb3IgdGhlIGNhc2Ugd2hlcmUgYHN0YXJ0YCBhbmQgYGVuZGAgYXJlIHRoZSBzYW1lLlxuICAgICAgcmV0dXJuIFtzdGFydF07XG4gICAgfVxuXG4gICAgY29uc3QgZm91bmQgPSBuZXcgU2V0PHRzLlNvdXJjZUZpbGU+KFtzdGFydF0pO1xuICAgIGNvbnN0IHF1ZXVlOiBGb3VuZFtdID0gW25ldyBGb3VuZChzdGFydCwgbnVsbCldO1xuXG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSBxdWV1ZS5zaGlmdCgpITtcbiAgICAgIGNvbnN0IGltcG9ydHMgPSB0aGlzLmltcG9ydHNPZihjdXJyZW50LnNvdXJjZUZpbGUpO1xuICAgICAgZm9yIChjb25zdCBpbXBvcnRlZEZpbGUgb2YgaW1wb3J0cykge1xuICAgICAgICBpZiAoIWZvdW5kLmhhcyhpbXBvcnRlZEZpbGUpKSB7XG4gICAgICAgICAgY29uc3QgbmV4dCA9IG5ldyBGb3VuZChpbXBvcnRlZEZpbGUsIGN1cnJlbnQpO1xuICAgICAgICAgIGlmIChuZXh0LnNvdXJjZUZpbGUgPT09IGVuZCkge1xuICAgICAgICAgICAgLy8gV2UgaGF2ZSBoaXQgdGhlIHRhcmdldCBgZW5kYCBwYXRoIHNvIHdlIGNhbiBzdG9wIGhlcmUuXG4gICAgICAgICAgICByZXR1cm4gbmV4dC50b1BhdGgoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm91bmQuYWRkKGltcG9ydGVkRmlsZSk7XG4gICAgICAgICAgcXVldWUucHVzaChuZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSByZWNvcmQgb2YgYW4gaW1wb3J0IGZyb20gYHNmYCB0byBgaW1wb3J0ZWRgLCB0aGF0J3Mgbm90IHByZXNlbnQgaW4gdGhlIG9yaWdpbmFsXG4gICAqIGB0cy5Qcm9ncmFtYCBidXQgd2lsbCBiZSByZW1lbWJlcmVkIGJ5IHRoZSBgSW1wb3J0R3JhcGhgLlxuICAgKi9cbiAgYWRkU3ludGhldGljSW1wb3J0KHNmOiB0cy5Tb3VyY2VGaWxlLCBpbXBvcnRlZDogdHMuU291cmNlRmlsZSk6IHZvaWQge1xuICAgIGlmIChpc0xvY2FsRmlsZShpbXBvcnRlZCkpIHtcbiAgICAgIHRoaXMuaW1wb3J0c09mKHNmKS5hZGQoaW1wb3J0ZWQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2NhbkltcG9ydHMoc2Y6IHRzLlNvdXJjZUZpbGUpOiBTZXQ8dHMuU291cmNlRmlsZT4ge1xuICAgIGNvbnN0IGltcG9ydHMgPSBuZXcgU2V0PHRzLlNvdXJjZUZpbGU+KCk7XG4gICAgLy8gTG9vayB0aHJvdWdoIHRoZSBzb3VyY2UgZmlsZSBmb3IgaW1wb3J0IHN0YXRlbWVudHMuXG4gICAgc2Yuc3RhdGVtZW50cy5mb3JFYWNoKHN0bXQgPT4ge1xuICAgICAgaWYgKCh0cy5pc0ltcG9ydERlY2xhcmF0aW9uKHN0bXQpIHx8IHRzLmlzRXhwb3J0RGVjbGFyYXRpb24oc3RtdCkpICYmXG4gICAgICAgICAgc3RtdC5tb2R1bGVTcGVjaWZpZXIgIT09IHVuZGVmaW5lZCAmJiB0cy5pc1N0cmluZ0xpdGVyYWwoc3RtdC5tb2R1bGVTcGVjaWZpZXIpKSB7XG4gICAgICAgIC8vIFJlc29sdmUgdGhlIG1vZHVsZSB0byBhIGZpbGUsIGFuZCBjaGVjayB3aGV0aGVyIHRoYXQgZmlsZSBpcyBpbiB0aGUgdHMuUHJvZ3JhbS5cbiAgICAgICAgY29uc3QgbW9kdWxlTmFtZSA9IHN0bXQubW9kdWxlU3BlY2lmaWVyLnRleHQ7XG4gICAgICAgIGNvbnN0IG1vZHVsZUZpbGUgPSB0aGlzLnJlc29sdmVyLnJlc29sdmVNb2R1bGUobW9kdWxlTmFtZSwgc2YuZmlsZU5hbWUpO1xuICAgICAgICBpZiAobW9kdWxlRmlsZSAhPT0gbnVsbCAmJiBpc0xvY2FsRmlsZShtb2R1bGVGaWxlKSkge1xuICAgICAgICAgIC8vIFJlY29yZCB0aGlzIGxvY2FsIGltcG9ydC5cbiAgICAgICAgICBpbXBvcnRzLmFkZChtb2R1bGVGaWxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBpbXBvcnRzO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzTG9jYWxGaWxlKHNmOiB0cy5Tb3VyY2VGaWxlKTogYm9vbGVhbiB7XG4gIHJldHVybiAhc2YuZmlsZU5hbWUuZW5kc1dpdGgoJy5kLnRzJyk7XG59XG5cbi8qKlxuICogQSBoZWxwZXIgY2xhc3MgdG8gdHJhY2sgd2hpY2ggU291cmNlRmlsZXMgYXJlIGJlaW5nIHByb2Nlc3NlZCB3aGVuIHNlYXJjaGluZyBmb3IgYSBwYXRoIGluXG4gKiBgZ2V0UGF0aCgpYCBhYm92ZS5cbiAqL1xuY2xhc3MgRm91bmQge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCByZWFkb25seSBwYXJlbnQ6IEZvdW5kfG51bGwpIHt9XG5cbiAgLyoqXG4gICAqIEJhY2sgdHJhY2sgdGhyb3VnaCB0aGlzIGZvdW5kIFNvdXJjZUZpbGUgYW5kIGl0cyBhbmNlc3RvcnMgdG8gZ2VuZXJhdGUgYW4gYXJyYXkgb2ZcbiAgICogU291cmNlRmlsZXMgdGhhdCBmb3JtIGFtIGltcG9ydCBwYXRoIGJldHdlZW4gdHdvIFNvdXJjZUZpbGVzLlxuICAgKi9cbiAgdG9QYXRoKCk6IHRzLlNvdXJjZUZpbGVbXSB7XG4gICAgY29uc3QgYXJyYXk6IHRzLlNvdXJjZUZpbGVbXSA9IFtdO1xuICAgIGxldCBjdXJyZW50OiBGb3VuZHxudWxsID0gdGhpcztcbiAgICB3aGlsZSAoY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgYXJyYXkucHVzaChjdXJyZW50LnNvdXJjZUZpbGUpO1xuICAgICAgY3VycmVudCA9IGN1cnJlbnQucGFyZW50O1xuICAgIH1cbiAgICAvLyBQdXNoaW5nIGFuZCB0aGVuIHJldmVyc2luZywgTyhuKSwgcmF0aGVyIHRoYW4gdW5zaGlmdGluZyByZXBlYXRlZGx5LCBPKG5eMiksIGF2b2lkc1xuICAgIC8vIG1hbmlwdWxhdGluZyB0aGUgYXJyYXkgb24gZXZlcnkgaXRlcmF0aW9uOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjYzNzA2MjBcbiAgICByZXR1cm4gYXJyYXkucmV2ZXJzZSgpO1xuICB9XG59XG4iXX0=