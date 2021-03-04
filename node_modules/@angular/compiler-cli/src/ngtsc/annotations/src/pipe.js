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
        define("@angular/compiler-cli/src/ngtsc/annotations/src/pipe", ["require", "exports", "tslib", "@angular/compiler", "typescript", "@angular/compiler-cli/src/ngtsc/diagnostics", "@angular/compiler-cli/src/ngtsc/imports", "@angular/compiler-cli/src/ngtsc/reflection", "@angular/compiler-cli/src/ngtsc/transform", "@angular/compiler-cli/src/ngtsc/annotations/src/diagnostics", "@angular/compiler-cli/src/ngtsc/annotations/src/factory", "@angular/compiler-cli/src/ngtsc/annotations/src/metadata", "@angular/compiler-cli/src/ngtsc/annotations/src/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PipeDecoratorHandler = void 0;
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var ts = require("typescript");
    var diagnostics_1 = require("@angular/compiler-cli/src/ngtsc/diagnostics");
    var imports_1 = require("@angular/compiler-cli/src/ngtsc/imports");
    var reflection_1 = require("@angular/compiler-cli/src/ngtsc/reflection");
    var transform_1 = require("@angular/compiler-cli/src/ngtsc/transform");
    var diagnostics_2 = require("@angular/compiler-cli/src/ngtsc/annotations/src/diagnostics");
    var factory_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/factory");
    var metadata_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/metadata");
    var util_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/util");
    var PipeDecoratorHandler = /** @class */ (function () {
        function PipeDecoratorHandler(reflector, evaluator, metaRegistry, scopeRegistry, defaultImportRecorder, injectableRegistry, isCore) {
            this.reflector = reflector;
            this.evaluator = evaluator;
            this.metaRegistry = metaRegistry;
            this.scopeRegistry = scopeRegistry;
            this.defaultImportRecorder = defaultImportRecorder;
            this.injectableRegistry = injectableRegistry;
            this.isCore = isCore;
            this.precedence = transform_1.HandlerPrecedence.PRIMARY;
            this.name = PipeDecoratorHandler.name;
        }
        PipeDecoratorHandler.prototype.detect = function (node, decorators) {
            if (!decorators) {
                return undefined;
            }
            var decorator = util_1.findAngularDecorator(decorators, 'Pipe', this.isCore);
            if (decorator !== undefined) {
                return {
                    trigger: decorator.node,
                    decorator: decorator,
                    metadata: decorator,
                };
            }
            else {
                return undefined;
            }
        };
        PipeDecoratorHandler.prototype.analyze = function (clazz, decorator) {
            var name = clazz.name.text;
            var type = util_1.wrapTypeReference(this.reflector, clazz);
            var internalType = new compiler_1.WrappedNodeExpr(this.reflector.getInternalNameOfClass(clazz));
            if (decorator.args === null) {
                throw new diagnostics_1.FatalDiagnosticError(diagnostics_1.ErrorCode.DECORATOR_NOT_CALLED, reflection_1.Decorator.nodeForError(decorator), "@Pipe must be called");
            }
            if (decorator.args.length !== 1) {
                throw new diagnostics_1.FatalDiagnosticError(diagnostics_1.ErrorCode.DECORATOR_ARITY_WRONG, reflection_1.Decorator.nodeForError(decorator), '@Pipe must have exactly one argument');
            }
            var meta = util_1.unwrapExpression(decorator.args[0]);
            if (!ts.isObjectLiteralExpression(meta)) {
                throw new diagnostics_1.FatalDiagnosticError(diagnostics_1.ErrorCode.DECORATOR_ARG_NOT_LITERAL, meta, '@Pipe must have a literal argument');
            }
            var pipe = reflection_1.reflectObjectLiteral(meta);
            if (!pipe.has('name')) {
                throw new diagnostics_1.FatalDiagnosticError(diagnostics_1.ErrorCode.PIPE_MISSING_NAME, meta, "@Pipe decorator is missing name field");
            }
            var pipeNameExpr = pipe.get('name');
            var pipeName = this.evaluator.evaluate(pipeNameExpr);
            if (typeof pipeName !== 'string') {
                throw diagnostics_2.createValueHasWrongTypeError(pipeNameExpr, pipeName, "@Pipe.name must be a string");
            }
            var pure = true;
            if (pipe.has('pure')) {
                var expr = pipe.get('pure');
                var pureValue = this.evaluator.evaluate(expr);
                if (typeof pureValue !== 'boolean') {
                    throw diagnostics_2.createValueHasWrongTypeError(expr, pureValue, "@Pipe.pure must be a boolean");
                }
                pure = pureValue;
            }
            return {
                analysis: {
                    meta: {
                        name: name,
                        type: type,
                        internalType: internalType,
                        typeArgumentCount: this.reflector.getGenericArityOfClass(clazz) || 0,
                        pipeName: pipeName,
                        deps: util_1.getValidConstructorDependencies(clazz, this.reflector, this.defaultImportRecorder, this.isCore),
                        pure: pure,
                    },
                    metadataStmt: metadata_1.generateSetClassMetadataCall(clazz, this.reflector, this.defaultImportRecorder, this.isCore),
                },
            };
        };
        PipeDecoratorHandler.prototype.register = function (node, analysis) {
            var ref = new imports_1.Reference(node);
            this.metaRegistry.registerPipeMetadata({ ref: ref, name: analysis.meta.pipeName });
            this.injectableRegistry.registerInjectable(node);
        };
        PipeDecoratorHandler.prototype.resolve = function (node) {
            var duplicateDeclData = this.scopeRegistry.getDuplicateDeclarations(node);
            if (duplicateDeclData !== null) {
                // This pipe was declared twice (or more).
                return {
                    diagnostics: [util_1.makeDuplicateDeclarationError(node, duplicateDeclData, 'Pipe')],
                };
            }
            return {};
        };
        PipeDecoratorHandler.prototype.compileFull = function (node, analysis) {
            var res = compiler_1.compilePipeFromMetadata(analysis.meta);
            return this.compilePipe(analysis, res);
        };
        PipeDecoratorHandler.prototype.compilePartial = function (node, analysis) {
            var res = compiler_1.compileDeclarePipeFromMetadata(analysis.meta);
            return this.compilePipe(analysis, res);
        };
        PipeDecoratorHandler.prototype.compilePipe = function (analysis, def) {
            var factoryRes = factory_1.compileNgFactoryDefField(tslib_1.__assign(tslib_1.__assign({}, analysis.meta), { injectFn: compiler_1.Identifiers.directiveInject, target: compiler_1.R3FactoryTarget.Pipe }));
            if (analysis.metadataStmt !== null) {
                factoryRes.statements.push(analysis.metadataStmt);
            }
            return [
                factoryRes, {
                    name: 'ɵpipe',
                    initializer: def.expression,
                    statements: [],
                    type: def.type,
                }
            ];
        };
        return PipeDecoratorHandler;
    }());
    exports.PipeDecoratorHandler = PipeDecoratorHandler;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvYW5ub3RhdGlvbnMvc3JjL3BpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7OztJQUVILDhDQUErSztJQUMvSywrQkFBaUM7SUFFakMsMkVBQWtFO0lBQ2xFLG1FQUErRDtJQUcvRCx5RUFBbUc7SUFFbkcsdUVBQWdJO0lBQ2hJLDJGQUEyRDtJQUUzRCxtRkFBbUQ7SUFDbkQscUZBQXdEO0lBQ3hELDZFQUFpSjtJQU9qSjtRQUNFLDhCQUNZLFNBQXlCLEVBQVUsU0FBMkIsRUFDOUQsWUFBOEIsRUFBVSxhQUF1QyxFQUMvRSxxQkFBNEMsRUFDNUMsa0JBQTJDLEVBQVUsTUFBZTtZQUhwRSxjQUFTLEdBQVQsU0FBUyxDQUFnQjtZQUFVLGNBQVMsR0FBVCxTQUFTLENBQWtCO1lBQzlELGlCQUFZLEdBQVosWUFBWSxDQUFrQjtZQUFVLGtCQUFhLEdBQWIsYUFBYSxDQUEwQjtZQUMvRSwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzVDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBeUI7WUFBVSxXQUFNLEdBQU4sTUFBTSxDQUFTO1lBRXZFLGVBQVUsR0FBRyw2QkFBaUIsQ0FBQyxPQUFPLENBQUM7WUFDdkMsU0FBSSxHQUFHLG9CQUFvQixDQUFDLElBQUksQ0FBQztRQUh5QyxDQUFDO1FBS3BGLHFDQUFNLEdBQU4sVUFBTyxJQUFzQixFQUFFLFVBQTRCO1lBQ3pELElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBQ2YsT0FBTyxTQUFTLENBQUM7YUFDbEI7WUFDRCxJQUFNLFNBQVMsR0FBRywyQkFBb0IsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4RSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7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QUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25ELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVELDZDQUFjLEdBQWQsVUFBZSxJQUFzQixFQUFFLFFBQW1DO1lBQ3hFLElBQU0sR0FBRyxHQUFHLHlDQUE4QixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTywwQ0FBVyxHQUFuQixVQUFvQixRQUFtQyxFQUFFLEdBQWM7WUFDckUsSUFBTSxVQUFVLEdBQUcsa0NBQXdCLHVDQUN0QyxRQUFRLENBQUMsSUFBSSxLQUNoQixRQUFRLEVBQUUsc0JBQVcsQ0FBQyxlQUFlLEVBQ3JDLE1BQU0sRUFBRSwwQkFBZSxDQUFDLElBQUksSUFDNUIsQ0FBQztZQUNILElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyxJQUFJLEVBQUU7Z0JBQ2xDLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUNuRDtZQUNELE9BQU87Z0JBQ0wsVUFBVSxFQUFFO29CQUNWLElBQUksRUFBRSxPQUFPO29CQUNiLFdBQVcsRUFBRSxHQUFHLENBQUMsVUFBVTtvQkFDM0IsVUFBVSxFQUFFLEVBQUU7b0JBQ2QsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJO2lCQUNmO2FBQ0YsQ0FBQztRQUNKLENBQUM7UUFDSCwyQkFBQztJQUFELENBQUMsQUF0SUQsSUFzSUM7SUF0SVksb0RBQW9CIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y29tcGlsZURlY2xhcmVQaXBlRnJvbU1ldGFkYXRhLCBjb21waWxlUGlwZUZyb21NZXRhZGF0YSwgSWRlbnRpZmllcnMsIFIzRmFjdG9yeVRhcmdldCwgUjNQaXBlRGVmLCBSM1BpcGVNZXRhZGF0YSwgU3RhdGVtZW50LCBXcmFwcGVkTm9kZUV4cHJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0Vycm9yQ29kZSwgRmF0YWxEaWFnbm9zdGljRXJyb3J9IGZyb20gJy4uLy4uL2RpYWdub3N0aWNzJztcbmltcG9ydCB7RGVmYXVsdEltcG9ydFJlY29yZGVyLCBSZWZlcmVuY2V9IGZyb20gJy4uLy4uL2ltcG9ydHMnO1xuaW1wb3J0IHtJbmplY3RhYmxlQ2xhc3NSZWdpc3RyeSwgTWV0YWRhdGFSZWdpc3RyeX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEnO1xuaW1wb3J0IHtQYXJ0aWFsRXZhbHVhdG9yfSBmcm9tICcuLi8uLi9wYXJ0aWFsX2V2YWx1YXRvcic7XG5pbXBvcnQge0NsYXNzRGVjbGFyYXRpb24sIERlY29yYXRvciwgUmVmbGVjdGlvbkhvc3QsIHJlZmxlY3RPYmplY3RMaXRlcmFsfSBmcm9tICcuLi8uLi9yZWZsZWN0aW9uJztcbmltcG9ydCB7TG9jYWxNb2R1bGVTY29wZVJlZ2lzdHJ5fSBmcm9tICcuLi8uLi9zY29wZSc7XG5pbXBvcnQge0FuYWx5c2lzT3V0cHV0LCBDb21waWxlUmVzdWx0LCBEZWNvcmF0b3JIYW5kbGVyLCBEZXRlY3RSZXN1bHQsIEhhbmRsZXJQcmVjZWRlbmNlLCBSZXNvbHZlUmVzdWx0fSBmcm9tICcuLi8uLi90cmFuc2Zvcm0nO1xuaW1wb3J0IHtjcmVhdGVWYWx1ZUhhc1dyb25nVHlwZUVycm9yfSBmcm9tICcuL2RpYWdub3N0aWNzJztcblxuaW1wb3J0IHtjb21waWxlTmdGYWN0b3J5RGVmRmllbGR9IGZyb20gJy4vZmFjdG9yeSc7XG5pbXBvcnQge2dlbmVyYXRlU2V0Q2xhc3NNZXRhZGF0YUNhbGx9IGZyb20gJy4vbWV0YWRhdGEnO1xuaW1wb3J0IHtmaW5kQW5ndWxhckRlY29yYXRvciwgZ2V0VmFsaWRDb25zdHJ1Y3RvckRlcGVuZGVuY2llcywgbWFrZUR1cGxpY2F0ZURlY2xhcmF0aW9uRXJyb3IsIHVud3JhcEV4cHJlc3Npb24sIHdyYXBUeXBlUmVmZXJlbmNlfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBpcGVIYW5kbGVyRGF0YSB7XG4gIG1ldGE6IFIzUGlwZU1ldGFkYXRhO1xuICBtZXRhZGF0YVN0bXQ6IFN0YXRlbWVudHxudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgUGlwZURlY29yYXRvckhhbmRsZXIgaW1wbGVtZW50cyBEZWNvcmF0b3JIYW5kbGVyPERlY29yYXRvciwgUGlwZUhhbmRsZXJEYXRhLCB1bmtub3duPiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSByZWZsZWN0b3I6IFJlZmxlY3Rpb25Ib3N0LCBwcml2YXRlIGV2YWx1YXRvcjogUGFydGlhbEV2YWx1YXRvcixcbiAgICAgIHByaXZhdGUgbWV0YVJlZ2lzdHJ5OiBNZXRhZGF0YVJlZ2lzdHJ5LCBwcml2YXRlIHNjb3BlUmVnaXN0cnk6IExvY2FsTW9kdWxlU2NvcGVSZWdpc3RyeSxcbiAgICAgIHByaXZhdGUgZGVmYXVsdEltcG9ydFJlY29yZGVyOiBEZWZhdWx0SW1wb3J0UmVjb3JkZXIsXG4gICAgICBwcml2YXRlIGluamVjdGFibGVSZWdpc3RyeTogSW5qZWN0YWJsZUNsYXNzUmVnaXN0cnksIHByaXZhdGUgaXNDb3JlOiBib29sZWFuKSB7fVxuXG4gIHJlYWRvbmx5IHByZWNlZGVuY2UgPSBIYW5kbGVyUHJlY2VkZW5jZS5QUklNQVJZO1xuICByZWFkb25seSBuYW1lID0gUGlwZURlY29yYXRvckhhbmRsZXIubmFtZTtcblxuICBkZXRlY3Qobm9kZTogQ2xhc3NEZWNsYXJhdGlvbiwgZGVjb3JhdG9yczogRGVjb3JhdG9yW118bnVsbCk6IERldGVjdFJlc3VsdDxEZWNvcmF0b3I+fHVuZGVmaW5lZCB7XG4gICAgaWYgKCFkZWNvcmF0b3JzKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBkZWNvcmF0b3IgPSBmaW5kQW5ndWxhckRlY29yYXRvcihkZWNvcmF0b3JzLCAnUGlwZScsIHRoaXMuaXNDb3JlKTtcbiAgICBpZiAoZGVjb3JhdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRyaWdnZXI6IGRlY29yYXRvci5ub2RlLFxuICAgICAgICBkZWNvcmF0b3I6IGRlY29yYXRvcixcbiAgICAgICAgbWV0YWRhdGE6IGRlY29yYXRvcixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgYW5hbHl6ZShjbGF6ejogQ2xhc3NEZWNsYXJhdGlvbiwgZGVjb3JhdG9yOiBSZWFkb25seTxEZWNvcmF0b3I+KTpcbiAgICAgIEFuYWx5c2lzT3V0cHV0PFBpcGVIYW5kbGVyRGF0YT4ge1xuICAgIGNvbnN0IG5hbWUgPSBjbGF6ei5uYW1lLnRleHQ7XG4gICAgY29uc3QgdHlwZSA9IHdyYXBUeXBlUmVmZXJlbmNlKHRoaXMucmVmbGVjdG9yLCBjbGF6eik7XG4gICAgY29uc3QgaW50ZXJuYWxUeXBlID0gbmV3IFdyYXBwZWROb2RlRXhwcih0aGlzLnJlZmxlY3Rvci5nZXRJbnRlcm5hbE5hbWVPZkNsYXNzKGNsYXp6KSk7XG5cbiAgICBpZiAoZGVjb3JhdG9yLmFyZ3MgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBGYXRhbERpYWdub3N0aWNFcnJvcihcbiAgICAgICAgICBFcnJvckNvZGUuREVDT1JBVE9SX05PVF9DQUxMRUQsIERlY29yYXRvci5ub2RlRm9yRXJyb3IoZGVjb3JhdG9yKSxcbiAgICAgICAgICBgQFBpcGUgbXVzdCBiZSBjYWxsZWRgKTtcbiAgICB9XG4gICAgaWYgKGRlY29yYXRvci5hcmdzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEZhdGFsRGlhZ25vc3RpY0Vycm9yKFxuICAgICAgICAgIEVycm9yQ29kZS5ERUNPUkFUT1JfQVJJVFlfV1JPTkcsIERlY29yYXRvci5ub2RlRm9yRXJyb3IoZGVjb3JhdG9yKSxcbiAgICAgICAgICAnQFBpcGUgbXVzdCBoYXZlIGV4YWN0bHkgb25lIGFyZ3VtZW50Jyk7XG4gICAgfVxuICAgIGNvbnN0IG1ldGEgPSB1bndyYXBFeHByZXNzaW9uKGRlY29yYXRvci5hcmdzWzBdKTtcbiAgICBpZiAoIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24obWV0YSkpIHtcbiAgICAgIHRocm93IG5ldyBGYXRhbERpYWdub3N0aWNFcnJvcihcbiAgICAgICAgICBFcnJvckNvZGUuREVDT1JBVE9SX0FSR19OT1RfTElURVJBTCwgbWV0YSwgJ0BQaXBlIG11c3QgaGF2ZSBhIGxpdGVyYWwgYXJndW1lbnQnKTtcbiAgICB9XG4gICAgY29uc3QgcGlwZSA9IHJlZmxlY3RPYmplY3RMaXRlcmFsKG1ldGEpO1xuXG4gICAgaWYgKCFwaXBlLmhhcygnbmFtZScpKSB7XG4gICAgICB0aHJvdyBuZXcgRmF0YWxEaWFnbm9zdGljRXJyb3IoXG4gICAgICAgICAgRXJyb3JDb2RlLlBJUEVfTUlTU0lOR19OQU1FLCBtZXRhLCBgQFBpcGUgZGVjb3JhdG9yIGlzIG1pc3NpbmcgbmFtZSBmaWVsZGApO1xuICAgIH1cbiAgICBjb25zdCBwaXBlTmFtZUV4cHIgPSBwaXBlLmdldCgnbmFtZScpITtcbiAgICBjb25zdCBwaXBlTmFtZSA9IHRoaXMuZXZhbHVhdG9yLmV2YWx1YXRlKHBpcGVOYW1lRXhwcik7XG4gICAgaWYgKHR5cGVvZiBwaXBlTmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZVZhbHVlSGFzV3JvbmdUeXBlRXJyb3IocGlwZU5hbWVFeHByLCBwaXBlTmFtZSwgYEBQaXBlLm5hbWUgbXVzdCBiZSBhIHN0cmluZ2ApO1xuICAgIH1cblxuICAgIGxldCBwdXJlID0gdHJ1ZTtcbiAgICBpZiAocGlwZS5oYXMoJ3B1cmUnKSkge1xuICAgICAgY29uc3QgZXhwciA9IHBpcGUuZ2V0KCdwdXJlJykhO1xuICAgICAgY29uc3QgcHVyZVZhbHVlID0gdGhpcy5ldmFsdWF0b3IuZXZhbHVhdGUoZXhwcik7XG4gICAgICBpZiAodHlwZW9mIHB1cmVWYWx1ZSAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHRocm93IGNyZWF0ZVZhbHVlSGFzV3JvbmdUeXBlRXJyb3IoZXhwciwgcHVyZVZhbHVlLCBgQFBpcGUucHVyZSBtdXN0IGJlIGEgYm9vbGVhbmApO1xuICAgICAgfVxuICAgICAgcHVyZSA9IHB1cmVWYWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYW5hbHlzaXM6IHtcbiAgICAgICAgbWV0YToge1xuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICBpbnRlcm5hbFR5cGUsXG4gICAgICAgICAgdHlwZUFyZ3VtZW50Q291bnQ6IHRoaXMucmVmbGVjdG9yLmdldEdlbmVyaWNBcml0eU9mQ2xhc3MoY2xhenopIHx8IDAsXG4gICAgICAgICAgcGlwZU5hbWUsXG4gICAgICAgICAgZGVwczogZ2V0VmFsaWRDb25zdHJ1Y3RvckRlcGVuZGVuY2llcyhcbiAgICAgICAgICAgICAgY2xhenosIHRoaXMucmVmbGVjdG9yLCB0aGlzLmRlZmF1bHRJbXBvcnRSZWNvcmRlciwgdGhpcy5pc0NvcmUpLFxuICAgICAgICAgIHB1cmUsXG4gICAgICAgIH0sXG4gICAgICAgIG1ldGFkYXRhU3RtdDogZ2VuZXJhdGVTZXRDbGFzc01ldGFkYXRhQ2FsbChcbiAgICAgICAgICAgIGNsYXp6LCB0aGlzLnJlZmxlY3RvciwgdGhpcy5kZWZhdWx0SW1wb3J0UmVjb3JkZXIsIHRoaXMuaXNDb3JlKSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHJlZ2lzdGVyKG5vZGU6IENsYXNzRGVjbGFyYXRpb24sIGFuYWx5c2lzOiBSZWFkb25seTxQaXBlSGFuZGxlckRhdGE+KTogdm9pZCB7XG4gICAgY29uc3QgcmVmID0gbmV3IFJlZmVyZW5jZShub2RlKTtcbiAgICB0aGlzLm1ldGFSZWdpc3RyeS5yZWdpc3RlclBpcGVNZXRhZGF0YSh7cmVmLCBuYW1lOiBhbmFseXNpcy5tZXRhLnBpcGVOYW1lfSk7XG5cbiAgICB0aGlzLmluamVjdGFibGVSZWdpc3RyeS5yZWdpc3RlckluamVjdGFibGUobm9kZSk7XG4gIH1cblxuICByZXNvbHZlKG5vZGU6IENsYXNzRGVjbGFyYXRpb24pOiBSZXNvbHZlUmVzdWx0PHVua25vd24+IHtcbiAgICBjb25zdCBkdXBsaWNhdGVEZWNsRGF0YSA9IHRoaXMuc2NvcGVSZWdpc3RyeS5nZXREdXBsaWNhdGVEZWNsYXJhdGlvbnMobm9kZSk7XG4gICAgaWYgKGR1cGxpY2F0ZURlY2xEYXRhICE9PSBudWxsKSB7XG4gICAgICAvLyBUaGlzIHBpcGUgd2FzIGRlY2xhcmVkIHR3aWNlIChvciBtb3JlKS5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRpYWdub3N0aWNzOiBbbWFrZUR1cGxpY2F0ZURlY2xhcmF0aW9uRXJyb3Iobm9kZSwgZHVwbGljYXRlRGVjbERhdGEsICdQaXBlJyldLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge307XG4gIH1cblxuICBjb21waWxlRnVsbChub2RlOiBDbGFzc0RlY2xhcmF0aW9uLCBhbmFseXNpczogUmVhZG9ubHk8UGlwZUhhbmRsZXJEYXRhPik6IENvbXBpbGVSZXN1bHRbXSB7XG4gICAgY29uc3QgcmVzID0gY29tcGlsZVBpcGVGcm9tTWV0YWRhdGEoYW5hbHlzaXMubWV0YSk7XG4gICAgcmV0dXJuIHRoaXMuY29tcGlsZVBpcGUoYW5hbHlzaXMsIHJlcyk7XG4gIH1cblxuICBjb21waWxlUGFydGlhbChub2RlOiBDbGFzc0RlY2xhcmF0aW9uLCBhbmFseXNpczogUmVhZG9ubHk8UGlwZUhhbmRsZXJEYXRhPik6IENvbXBpbGVSZXN1bHRbXSB7XG4gICAgY29uc3QgcmVzID0gY29tcGlsZURlY2xhcmVQaXBlRnJvbU1ldGFkYXRhKGFuYWx5c2lzLm1ldGEpO1xuICAgIHJldHVybiB0aGlzLmNvbXBpbGVQaXBlKGFuYWx5c2lzLCByZXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb21waWxlUGlwZShhbmFseXNpczogUmVhZG9ubHk8UGlwZUhhbmRsZXJEYXRhPiwgZGVmOiBSM1BpcGVEZWYpIHtcbiAgICBjb25zdCBmYWN0b3J5UmVzID0gY29tcGlsZU5nRmFjdG9yeURlZkZpZWxkKHtcbiAgICAgIC4uLmFuYWx5c2lzLm1ldGEsXG4gICAgICBpbmplY3RGbjogSWRlbnRpZmllcnMuZGlyZWN0aXZlSW5qZWN0LFxuICAgICAgdGFyZ2V0OiBSM0ZhY3RvcnlUYXJnZXQuUGlwZSxcbiAgICB9KTtcbiAgICBpZiAoYW5hbHlzaXMubWV0YWRhdGFTdG10ICE9PSBudWxsKSB7XG4gICAgICBmYWN0b3J5UmVzLnN0YXRlbWVudHMucHVzaChhbmFseXNpcy5tZXRhZGF0YVN0bXQpO1xuICAgIH1cbiAgICByZXR1cm4gW1xuICAgICAgZmFjdG9yeVJlcywge1xuICAgICAgICBuYW1lOiAnybVwaXBlJyxcbiAgICAgICAgaW5pdGlhbGl6ZXI6IGRlZi5leHByZXNzaW9uLFxuICAgICAgICBzdGF0ZW1lbnRzOiBbXSxcbiAgICAgICAgdHlwZTogZGVmLnR5cGUsXG4gICAgICB9XG4gICAgXTtcbiAgfVxufVxuIl19