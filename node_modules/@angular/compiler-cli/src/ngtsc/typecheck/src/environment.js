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
        define("@angular/compiler-cli/src/ngtsc/typecheck/src/environment", ["require", "exports", "tslib", "@angular/compiler", "typescript", "@angular/compiler-cli/src/ngtsc/imports", "@angular/compiler-cli/src/ngtsc/translator", "@angular/compiler-cli/src/ngtsc/typecheck/src/ts_util", "@angular/compiler-cli/src/ngtsc/typecheck/src/type_constructor", "@angular/compiler-cli/src/ngtsc/typecheck/src/type_parameter_emitter"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Environment = void 0;
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var ts = require("typescript");
    var imports_1 = require("@angular/compiler-cli/src/ngtsc/imports");
    var translator_1 = require("@angular/compiler-cli/src/ngtsc/translator");
    var ts_util_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/ts_util");
    var type_constructor_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/type_constructor");
    var type_parameter_emitter_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/type_parameter_emitter");
    /**
     * A context which hosts one or more Type Check Blocks (TCBs).
     *
     * An `Environment` supports the generation of TCBs by tracking necessary imports, declarations of
     * type constructors, and other statements beyond the type-checking code within the TCB itself.
     * Through method calls on `Environment`, the TCB generator can request `ts.Expression`s which
     * reference declarations in the `Environment` for these artifacts`.
     *
     * `Environment` can be used in a standalone fashion, or can be extended to support more specialized
     * usage.
     */
    var Environment = /** @class */ (function () {
        function Environment(config, importManager, refEmitter, reflector, contextFile) {
            this.config = config;
            this.importManager = importManager;
            this.refEmitter = refEmitter;
            this.reflector = reflector;
            this.contextFile = contextFile;
            this.nextIds = {
                pipeInst: 1,
                typeCtor: 1,
            };
            this.typeCtors = new Map();
            this.typeCtorStatements = [];
            this.pipeInsts = new Map();
            this.pipeInstStatements = [];
        }
        /**
         * Get an expression referring to a type constructor for the given directive.
         *
         * Depending on the shape of the directive itself, this could be either a reference to a declared
         * type constructor, or to an inline type constructor.
         */
        Environment.prototype.typeCtorFor = function (dir) {
            var dirRef = dir.ref;
            var node = dirRef.node;
            if (this.typeCtors.has(node)) {
                return this.typeCtors.get(node);
            }
            if (type_constructor_1.requiresInlineTypeCtor(node, this.reflector)) {
                // The constructor has already been created inline, we just need to construct a reference to
                // it.
                var ref = this.reference(dirRef);
                var typeCtorExpr = ts.createPropertyAccess(ref, 'ngTypeCtor');
                this.typeCtors.set(node, typeCtorExpr);
                return typeCtorExpr;
            }
            else {
                var fnName = "_ctor" + this.nextIds.typeCtor++;
                var nodeTypeRef = this.referenceType(dirRef);
                if (!ts.isTypeReferenceNode(nodeTypeRef)) {
                    throw new Error("Expected TypeReferenceNode from reference to " + dirRef.debugName);
                }
                var meta = {
                    fnName: fnName,
                    body: true,
                    fields: {
                        inputs: dir.inputs.classPropertyNames,
                        outputs: dir.outputs.classPropertyNames,
                        // TODO: support queries
                        queries: dir.queries,
                    },
                    coercedInputFields: dir.coercedInputFields,
                };
                var typeParams = this.emitTypeParameters(node);
                var typeCtor = type_constructor_1.generateTypeCtorDeclarationFn(node, meta, nodeTypeRef.typeName, typeParams, this.reflector);
                this.typeCtorStatements.push(typeCtor);
                var fnId = ts.createIdentifier(fnName);
                this.typeCtors.set(node, fnId);
                return fnId;
            }
        };
        /*
         * Get an expression referring to an instance of the given pipe.
         */
        Environment.prototype.pipeInst = function (ref) {
            if (this.pipeInsts.has(ref.node)) {
                return this.pipeInsts.get(ref.node);
            }
            var pipeType = this.referenceType(ref);
            var pipeInstId = ts.createIdentifier("_pipe" + this.nextIds.pipeInst++);
            this.pipeInstStatements.push(ts_util_1.tsDeclareVariable(pipeInstId, pipeType));
            this.pipeInsts.set(ref.node, pipeInstId);
            return pipeInstId;
        };
        /**
         * Generate a `ts.Expression` that references the given node.
         *
         * This may involve importing the node into the file if it's not declared there already.
         */
        Environment.prototype.reference = function (ref) {
            // Disable aliasing for imports generated in a template type-checking context, as there is no
            // guarantee that any alias re-exports exist in the .d.ts files. It's safe to use direct imports
            // in these cases as there is no strict dependency checking during the template type-checking
            // pass.
            var ngExpr = this.refEmitter.emit(ref, this.contextFile, imports_1.ImportFlags.NoAliasing);
            // Use `translateExpression` to convert the `Expression` into a `ts.Expression`.
            return translator_1.translateExpression(ngExpr, this.importManager);
        };
        /**
         * Generate a `ts.TypeNode` that references the given node as a type.
         *
         * This may involve importing the node into the file if it's not declared there already.
         */
        Environment.prototype.referenceType = function (ref) {
            var ngExpr = this.refEmitter.emit(ref, this.contextFile, imports_1.ImportFlags.NoAliasing | imports_1.ImportFlags.AllowTypeImports);
            // Create an `ExpressionType` from the `Expression` and translate it via `translateType`.
            // TODO(alxhub): support references to types with generic arguments in a clean way.
            return translator_1.translateType(new compiler_1.ExpressionType(ngExpr), this.importManager);
        };
        Environment.prototype.emitTypeParameters = function (declaration) {
            var _this = this;
            var emitter = new type_parameter_emitter_1.TypeParameterEmitter(declaration.typeParameters, this.reflector);
            return emitter.emit(function (ref) { return _this.referenceType(ref); });
        };
        /**
         * Generate a `ts.TypeNode` that references a given type from the provided module.
         *
         * This will involve importing the type into the file, and will also add type parameters if
         * provided.
         */
        Environment.prototype.referenceExternalType = function (moduleName, name, typeParams) {
            var external = new compiler_1.ExternalExpr({ moduleName: moduleName, name: name });
            return translator_1.translateType(new compiler_1.ExpressionType(external, [ /* modifiers */], typeParams), this.importManager);
        };
        Environment.prototype.getPreludeStatements = function () {
            return tslib_1.__spread(this.pipeInstStatements, this.typeCtorStatements);
        };
        return Environment;
    }());
    exports.Environment = Environment;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL3R5cGVjaGVjay9zcmMvZW52aXJvbm1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7OztJQUVILDhDQUFzRjtJQUN0RiwrQkFBaUM7SUFFakMsbUVBQXVFO0lBRXZFLHlFQUFtRjtJQUduRixpRkFBNEM7SUFDNUMsbUdBQXlGO0lBQ3pGLCtHQUE4RDtJQUU5RDs7Ozs7Ozs7OztPQVVHO0lBQ0g7UUFZRSxxQkFDYSxNQUEwQixFQUFZLGFBQTRCLEVBQ25FLFVBQTRCLEVBQVUsU0FBeUIsRUFDN0QsV0FBMEI7WUFGM0IsV0FBTSxHQUFOLE1BQU0sQ0FBb0I7WUFBWSxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUNuRSxlQUFVLEdBQVYsVUFBVSxDQUFrQjtZQUFVLGNBQVMsR0FBVCxTQUFTLENBQWdCO1lBQzdELGdCQUFXLEdBQVgsV0FBVyxDQUFlO1lBZGhDLFlBQU8sR0FBRztnQkFDaEIsUUFBUSxFQUFFLENBQUM7Z0JBQ1gsUUFBUSxFQUFFLENBQUM7YUFDWixDQUFDO1lBRU0sY0FBUyxHQUFHLElBQUksR0FBRyxFQUFtQyxDQUFDO1lBQ3JELHVCQUFrQixHQUFtQixFQUFFLENBQUM7WUFFMUMsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFtQyxDQUFDO1lBQ3JELHVCQUFrQixHQUFtQixFQUFFLENBQUM7UUFLUCxDQUFDO1FBRTVDOzs7OztXQUtHO1FBQ0gsaUNBQVcsR0FBWCxVQUFZLEdBQStCO1lBQ3pDLElBQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxHQUF1RCxDQUFDO1lBQzNFLElBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDekIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENB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QyxDQUFDO1lBQ3RELE9BQU8sMEJBQWEsQ0FDaEIsSUFBSSx5QkFBYyxDQUFDLFFBQVEsRUFBRSxFQUFDLGVBQWUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN2RixDQUFDO1FBRUQsMENBQW9CLEdBQXBCO1lBQ0Usd0JBQ0ssSUFBSSxDQUFDLGtCQUFrQixFQUN2QixJQUFJLENBQUMsa0JBQWtCLEVBQzFCO1FBQ0osQ0FBQztRQUNILGtCQUFDO0lBQUQsQ0FBQyxBQXZJRCxJQXVJQztJQXZJWSxrQ0FBVyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V4cHJlc3Npb25UeXBlLCBFeHRlcm5hbEV4cHIsIFR5cGUsIFdyYXBwZWROb2RlRXhwcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7SW1wb3J0RmxhZ3MsIFJlZmVyZW5jZSwgUmVmZXJlbmNlRW1pdHRlcn0gZnJvbSAnLi4vLi4vaW1wb3J0cyc7XG5pbXBvcnQge0NsYXNzRGVjbGFyYXRpb24sIFJlZmxlY3Rpb25Ib3N0fSBmcm9tICcuLi8uLi9yZWZsZWN0aW9uJztcbmltcG9ydCB7SW1wb3J0TWFuYWdlciwgdHJhbnNsYXRlRXhwcmVzc2lvbiwgdHJhbnNsYXRlVHlwZX0gZnJvbSAnLi4vLi4vdHJhbnNsYXRvcic7XG5pbXBvcnQge1R5cGVDaGVja2FibGVEaXJlY3RpdmVNZXRhLCBUeXBlQ2hlY2tpbmdDb25maWcsIFR5cGVDdG9yTWV0YWRhdGF9IGZyb20gJy4uL2FwaSc7XG5cbmltcG9ydCB7dHNEZWNsYXJlVmFyaWFibGV9IGZyb20gJy4vdHNfdXRpbCc7XG5pbXBvcnQge2dlbmVyYXRlVHlwZUN0b3JEZWNsYXJhdGlvbkZuLCByZXF1aXJlc0lubGluZVR5cGVDdG9yfSBmcm9tICcuL3R5cGVfY29uc3RydWN0b3InO1xuaW1wb3J0IHtUeXBlUGFyYW1ldGVyRW1pdHRlcn0gZnJvbSAnLi90eXBlX3BhcmFtZXRlcl9lbWl0dGVyJztcblxuLyoqXG4gKiBBIGNvbnRleHQgd2hpY2ggaG9zdHMgb25lIG9yIG1vcmUgVHlwZSBDaGVjayBCbG9ja3MgKFRDQnMpLlxuICpcbiAqIEFuIGBFbnZpcm9ubWVudGAgc3VwcG9ydHMgdGhlIGdlbmVyYXRpb24gb2YgVENCcyBieSB0cmFja2luZyBuZWNlc3NhcnkgaW1wb3J0cywgZGVjbGFyYXRpb25zIG9mXG4gKiB0eXBlIGNvbnN0cnVjdG9ycywgYW5kIG90aGVyIHN0YXRlbWVudHMgYmV5b25kIHRoZSB0eXBlLWNoZWNraW5nIGNvZGUgd2l0aGluIHRoZSBUQ0IgaXRzZWxmLlxuICogVGhyb3VnaCBtZXRob2QgY2FsbHMgb24gYEVudmlyb25tZW50YCwgdGhlIFRDQiBnZW5lcmF0b3IgY2FuIHJlcXVlc3QgYHRzLkV4cHJlc3Npb25gcyB3aGljaFxuICogcmVmZXJlbmNlIGRlY2xhcmF0aW9ucyBpbiB0aGUgYEVudmlyb25tZW50YCBmb3IgdGhlc2UgYXJ0aWZhY3RzYC5cbiAqXG4gKiBgRW52aXJvbm1lbnRgIGNhbiBiZSB1c2VkIGluIGEgc3RhbmRhbG9uZSBmYXNoaW9uLCBvciBjYW4gYmUgZXh0ZW5kZWQgdG8gc3VwcG9ydCBtb3JlIHNwZWNpYWxpemVkXG4gKiB1c2FnZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEVudmlyb25tZW50IHtcbiAgcHJpdmF0ZSBuZXh0SWRzID0ge1xuICAgIHBpcGVJbnN0OiAxLFxuICAgIHR5cGVDdG9yOiAxLFxuICB9O1xuXG4gIHByaXZhdGUgdHlwZUN0b3JzID0gbmV3IE1hcDxDbGFzc0RlY2xhcmF0aW9uLCB0cy5FeHByZXNzaW9uPigpO1xuICBwcm90ZWN0ZWQgdHlwZUN0b3JTdGF0ZW1lbnRzOiB0cy5TdGF0ZW1lbnRbXSA9IFtdO1xuXG4gIHByaXZhdGUgcGlwZUluc3RzID0gbmV3IE1hcDxDbGFzc0RlY2xhcmF0aW9uLCB0cy5FeHByZXNzaW9uPigpO1xuICBwcm90ZWN0ZWQgcGlwZUluc3RTdGF0ZW1lbnRzOiB0cy5TdGF0ZW1lbnRbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcmVhZG9ubHkgY29uZmlnOiBUeXBlQ2hlY2tpbmdDb25maWcsIHByb3RlY3RlZCBpbXBvcnRNYW5hZ2VyOiBJbXBvcnRNYW5hZ2VyLFxuICAgICAgcHJpdmF0ZSByZWZFbWl0dGVyOiBSZWZlcmVuY2VFbWl0dGVyLCBwcml2YXRlIHJlZmxlY3RvcjogUmVmbGVjdGlvbkhvc3QsXG4gICAgICBwcm90ZWN0ZWQgY29udGV4dEZpbGU6IHRzLlNvdXJjZUZpbGUpIHt9XG5cbiAgLyoqXG4gICAqIEdldCBhbiBleHByZXNzaW9uIHJlZmVycmluZyB0byBhIHR5cGUgY29uc3RydWN0b3IgZm9yIHRoZSBnaXZlbiBkaXJlY3RpdmUuXG4gICAqXG4gICAqIERlcGVuZGluZyBvbiB0aGUgc2hhcGUgb2YgdGhlIGRpcmVjdGl2ZSBpdHNlbGYsIHRoaXMgY291bGQgYmUgZWl0aGVyIGEgcmVmZXJlbmNlIHRvIGEgZGVjbGFyZWRcbiAgICogdHlwZSBjb25zdHJ1Y3Rvciwgb3IgdG8gYW4gaW5saW5lIHR5cGUgY29uc3RydWN0b3IuXG4gICAqL1xuICB0eXBlQ3RvckZvcihkaXI6IFR5cGVDaGVja2FibGVEaXJlY3RpdmVNZXRhKTogdHMuRXhwcmVzc2lvbiB7XG4gICAgY29uc3QgZGlyUmVmID0gZGlyLnJlZiBhcyBSZWZlcmVuY2U8Q2xhc3NEZWNsYXJhdGlvbjx0cy5DbGFzc0RlY2xhcmF0aW9uPj47XG4gICAgY29uc3Qgbm9kZSA9IGRpclJlZi5ub2RlO1xuICAgIGlmICh0aGlzLnR5cGVDdG9ycy5oYXMobm9kZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLnR5cGVDdG9ycy5nZXQobm9kZSkhO1xuICAgIH1cblxuICAgIGlmIChyZXF1aXJlc0lubGluZVR5cGVDdG9yKG5vZGUsIHRoaXMucmVmbGVjdG9yKSkge1xuICAgICAgLy8gVGhlIGNvbnN0cnVjdG9yIGhhcyBhbHJlYWR5IGJlZW4gY3JlYXRlZCBpbmxpbmUsIHdlIGp1c3QgbmVlZCB0byBjb25zdHJ1Y3QgYSByZWZlcmVuY2UgdG9cbiAgICAgIC8vIGl0LlxuICAgICAgY29uc3QgcmVmID0gdGhpcy5yZWZlcmVuY2UoZGlyUmVmKTtcbiAgICAgIGNvbnN0IHR5cGVDdG9yRXhwciA9IHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKHJlZiwgJ25nVHlwZUN0b3InKTtcbiAgICAgIHRoaXMudHlwZUN0b3JzLnNldChub2RlLCB0eXBlQ3RvckV4cHIpO1xuICAgICAgcmV0dXJuIHR5cGVDdG9yRXhwcjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZm5OYW1lID0gYF9jdG9yJHt0aGlzLm5leHRJZHMudHlwZUN0b3IrK31gO1xuICAgICAgY29uc3Qgbm9kZVR5cGVSZWYgPSB0aGlzLnJlZmVyZW5jZVR5cGUoZGlyUmVmKTtcbiAgICAgIGlmICghdHMuaXNUeXBlUmVmZXJlbmNlTm9kZShub2RlVHlwZVJlZikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBUeXBlUmVmZXJlbmNlTm9kZSBmcm9tIHJlZmVyZW5jZSB0byAke2RpclJlZi5kZWJ1Z05hbWV9YCk7XG4gICAgICB9XG4gICAgICBjb25zdCBtZXRhOiBUeXBlQ3Rvck1ldGFkYXRhID0ge1xuICAgICAgICBmbk5hbWUsXG4gICAgICAgIGJvZHk6IHRydWUsXG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgIGlucHV0czogZGlyLmlucHV0cy5jbGFzc1Byb3BlcnR5TmFtZXMsXG4gICAgICAgICAgb3V0cHV0czogZGlyLm91dHB1dHMuY2xhc3NQcm9wZXJ0eU5hbWVzLFxuICAgICAgICAgIC8vIFRPRE86IHN1cHBvcnQgcXVlcmllc1xuICAgICAgICAgIHF1ZXJpZXM6IGRpci5xdWVyaWVzLFxuICAgICAgICB9LFxuICAgICAgICBjb2VyY2VkSW5wdXRGaWVsZHM6IGRpci5jb2VyY2VkSW5wdXRGaWVsZHMsXG4gICAgICB9O1xuICAgICAgY29uc3QgdHlwZVBhcmFtcyA9IHRoaXMuZW1pdFR5cGVQYXJhbWV0ZXJzKG5vZGUpO1xuICAgICAgY29uc3QgdHlwZUN0b3IgPSBnZW5lcmF0ZVR5cGVDdG9yRGVjbGFyYXRpb25GbihcbiAgICAgICAgICBub2RlLCBtZXRhLCBub2RlVHlwZVJlZi50eXBlTmFtZSwgdHlwZVBhcmFtcywgdGhpcy5yZWZsZWN0b3IpO1xuICAgICAgdGhpcy50eXBlQ3RvclN0YXRlbWVudHMucHVzaCh0eXBlQ3Rvcik7XG4gICAgICBjb25zdCBmbklkID0gdHMuY3JlYXRlSWRlbnRpZmllcihmbk5hbWUpO1xuICAgICAgdGhpcy50eXBlQ3RvcnMuc2V0KG5vZGUsIGZuSWQpO1xuICAgICAgcmV0dXJuIGZuSWQ7XG4gICAgfVxuICB9XG5cbiAgLypcbiAgICogR2V0IGFuIGV4cHJlc3Npb24gcmVmZXJyaW5nIHRvIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBwaXBlLlxuICAgKi9cbiAgcGlwZUluc3QocmVmOiBSZWZlcmVuY2U8Q2xhc3NEZWNsYXJhdGlvbjx0cy5DbGFzc0RlY2xhcmF0aW9uPj4pOiB0cy5FeHByZXNzaW9uIHtcbiAgICBpZiAodGhpcy5waXBlSW5zdHMuaGFzKHJlZi5ub2RlKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGlwZUluc3RzLmdldChyZWYubm9kZSkhO1xuICAgIH1cblxuICAgIGNvbnN0IHBpcGVUeXBlID0gdGhpcy5yZWZlcmVuY2VUeXBlKHJlZik7XG4gICAgY29uc3QgcGlwZUluc3RJZCA9IHRzLmNyZWF0ZUlkZW50aWZpZXIoYF9waXBlJHt0aGlzLm5leHRJZHMucGlwZUluc3QrK31gKTtcblxuICAgIHRoaXMucGlwZUluc3RTdGF0ZW1lbnRzLnB1c2godHNEZWNsYXJlVmFyaWFibGUocGlwZUluc3RJZCwgcGlwZVR5cGUpKTtcbiAgICB0aGlzLnBpcGVJbnN0cy5zZXQocmVmLm5vZGUsIHBpcGVJbnN0SWQpO1xuXG4gICAgcmV0dXJuIHBpcGVJbnN0SWQ7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgYSBgdHMuRXhwcmVzc2lvbmAgdGhhdCByZWZlcmVuY2VzIHRoZSBnaXZlbiBub2RlLlxuICAgKlxuICAgKiBUaGlzIG1heSBpbnZvbHZlIGltcG9ydGluZyB0aGUgbm9kZSBpbnRvIHRoZSBmaWxlIGlmIGl0J3Mgbm90IGRlY2xhcmVkIHRoZXJlIGFscmVhZHkuXG4gICAqL1xuICByZWZlcmVuY2UocmVmOiBSZWZlcmVuY2U8Q2xhc3NEZWNsYXJhdGlvbjx0cy5DbGFzc0RlY2xhcmF0aW9uPj4pOiB0cy5FeHByZXNzaW9uIHtcbiAgICAvLyBEaXNhYmxlIGFsaWFzaW5nIGZvciBpbXBvcnRzIGdlbmVyYXRlZCBpbiBhIHRlbXBsYXRlIHR5cGUtY2hlY2tpbmcgY29udGV4dCwgYXMgdGhlcmUgaXMgbm9cbiAgICAvLyBndWFyYW50ZWUgdGhhdCBhbnkgYWxpYXMgcmUtZXhwb3J0cyBleGlzdCBpbiB0aGUgLmQudHMgZmlsZXMuIEl0J3Mgc2FmZSB0byB1c2UgZGlyZWN0IGltcG9ydHNcbiAgICAvLyBpbiB0aGVzZSBjYXNlcyBhcyB0aGVyZSBpcyBubyBzdHJpY3QgZGVwZW5kZW5jeSBjaGVja2luZyBkdXJpbmcgdGhlIHRlbXBsYXRlIHR5cGUtY2hlY2tpbmdcbiAgICAvLyBwYXNzLlxuICAgIGNvbnN0IG5nRXhwciA9IHRoaXMucmVmRW1pdHRlci5lbWl0KHJlZiwgdGhpcy5jb250ZXh0RmlsZSwgSW1wb3J0RmxhZ3MuTm9BbGlhc2luZyk7XG5cbiAgICAvLyBVc2UgYHRyYW5zbGF0ZUV4cHJlc3Npb25gIHRvIGNvbnZlcnQgdGhlIGBFeHByZXNzaW9uYCBpbnRvIGEgYHRzLkV4cHJlc3Npb25gLlxuICAgIHJldHVybiB0cmFuc2xhdGVFeHByZXNzaW9uKG5nRXhwciwgdGhpcy5pbXBvcnRNYW5hZ2VyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIGB0cy5UeXBlTm9kZWAgdGhhdCByZWZlcmVuY2VzIHRoZSBnaXZlbiBub2RlIGFzIGEgdHlwZS5cbiAgICpcbiAgICogVGhpcyBtYXkgaW52b2x2ZSBpbXBvcnRpbmcgdGhlIG5vZGUgaW50byB0aGUgZmlsZSBpZiBpdCdzIG5vdCBkZWNsYXJlZCB0aGVyZSBhbHJlYWR5LlxuICAgKi9cbiAgcmVmZXJlbmNlVHlwZShyZWY6IFJlZmVyZW5jZSk6IHRzLlR5cGVOb2RlIHtcbiAgICBjb25zdCBuZ0V4cHIgPSB0aGlzLnJlZkVtaXR0ZXIuZW1pdChcbiAgICAgICAgcmVmLCB0aGlzLmNvbnRleHRGaWxlLCBJbXBvcnRGbGFncy5Ob0FsaWFzaW5nIHwgSW1wb3J0RmxhZ3MuQWxsb3dUeXBlSW1wb3J0cyk7XG5cbiAgICAvLyBDcmVhdGUgYW4gYEV4cHJlc3Npb25UeXBlYCBmcm9tIHRoZSBgRXhwcmVzc2lvbmAgYW5kIHRyYW5zbGF0ZSBpdCB2aWEgYHRyYW5zbGF0ZVR5cGVgLlxuICAgIC8vIFRPRE8oYWx4aHViKTogc3VwcG9ydCByZWZlcmVuY2VzIHRvIHR5cGVzIHdpdGggZ2VuZXJpYyBhcmd1bWVudHMgaW4gYSBjbGVhbiB3YXkuXG4gICAgcmV0dXJuIHRyYW5zbGF0ZVR5cGUobmV3IEV4cHJlc3Npb25UeXBlKG5nRXhwciksIHRoaXMuaW1wb3J0TWFuYWdlcik7XG4gIH1cblxuICBwcml2YXRlIGVtaXRUeXBlUGFyYW1ldGVycyhkZWNsYXJhdGlvbjogQ2xhc3NEZWNsYXJhdGlvbjx0cy5DbGFzc0RlY2xhcmF0aW9uPik6XG4gICAgICB0cy5UeXBlUGFyYW1ldGVyRGVjbGFyYXRpb25bXXx1bmRlZmluZWQge1xuICAgIGNvbnN0IGVtaXR0ZXIgPSBuZXcgVHlwZVBhcmFtZXRlckVtaXR0ZXIoZGVjbGFyYXRpb24udHlwZVBhcmFtZXRlcnMsIHRoaXMucmVmbGVjdG9yKTtcbiAgICByZXR1cm4gZW1pdHRlci5lbWl0KHJlZiA9PiB0aGlzLnJlZmVyZW5jZVR5cGUocmVmKSk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgYSBgdHMuVHlwZU5vZGVgIHRoYXQgcmVmZXJlbmNlcyBhIGdpdmVuIHR5cGUgZnJvbSB0aGUgcHJvdmlkZWQgbW9kdWxlLlxuICAgKlxuICAgKiBUaGlzIHdpbGwgaW52b2x2ZSBpbXBvcnRpbmcgdGhlIHR5cGUgaW50byB0aGUgZmlsZSwgYW5kIHdpbGwgYWxzbyBhZGQgdHlwZSBwYXJhbWV0ZXJzIGlmXG4gICAqIHByb3ZpZGVkLlxuICAgKi9cbiAgcmVmZXJlbmNlRXh0ZXJuYWxUeXBlKG1vZHVsZU5hbWU6IHN0cmluZywgbmFtZTogc3RyaW5nLCB0eXBlUGFyYW1zPzogVHlwZVtdKTogdHMuVHlwZU5vZGUge1xuICAgIGNvbnN0IGV4dGVybmFsID0gbmV3IEV4dGVybmFsRXhwcih7bW9kdWxlTmFtZSwgbmFtZX0pO1xuICAgIHJldHVybiB0cmFuc2xhdGVUeXBlKFxuICAgICAgICBuZXcgRXhwcmVzc2lvblR5cGUoZXh0ZXJuYWwsIFsvKiBtb2RpZmllcnMgKi9dLCB0eXBlUGFyYW1zKSwgdGhpcy5pbXBvcnRNYW5hZ2VyKTtcbiAgfVxuXG4gIGdldFByZWx1ZGVTdGF0ZW1lbnRzKCk6IHRzLlN0YXRlbWVudFtdIHtcbiAgICByZXR1cm4gW1xuICAgICAgLi4udGhpcy5waXBlSW5zdFN0YXRlbWVudHMsXG4gICAgICAuLi50aGlzLnR5cGVDdG9yU3RhdGVtZW50cyxcbiAgICBdO1xuICB9XG59XG4iXX0=