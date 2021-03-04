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
        define("@angular/compiler/src/render3/r3_pipe_compiler", ["require", "exports", "tslib", "@angular/compiler/src/compile_metadata", "@angular/compiler/src/output/output_ast", "@angular/compiler/src/util", "@angular/compiler/src/render3/r3_factory", "@angular/compiler/src/render3/r3_identifiers", "@angular/compiler/src/render3/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compilePipeFromRender2 = exports.createPipeType = exports.compilePipeFromMetadata = void 0;
    var tslib_1 = require("tslib");
    var compile_metadata_1 = require("@angular/compiler/src/compile_metadata");
    var o = require("@angular/compiler/src/output/output_ast");
    var util_1 = require("@angular/compiler/src/util");
    var r3_factory_1 = require("@angular/compiler/src/render3/r3_factory");
    var r3_identifiers_1 = require("@angular/compiler/src/render3/r3_identifiers");
    var util_2 = require("@angular/compiler/src/render3/util");
    function compilePipeFromMetadata(metadata) {
        var definitionMapValues = [];
        // e.g. `name: 'myPipe'`
        definitionMapValues.push({ key: 'name', value: o.literal(metadata.pipeName), quoted: false });
        // e.g. `type: MyPipe`
        definitionMapValues.push({ key: 'type', value: metadata.type.value, quoted: false });
        // e.g. `pure: true`
        definitionMapValues.push({ key: 'pure', value: o.literal(metadata.pure), quoted: false });
        var expression = o.importExpr(r3_identifiers_1.Identifiers.definePipe).callFn([o.literalMap(definitionMapValues)]);
        var type = createPipeType(metadata);
        return { expression: expression, type: type };
    }
    exports.compilePipeFromMetadata = compilePipeFromMetadata;
    function createPipeType(metadata) {
        return new o.ExpressionType(o.importExpr(r3_identifiers_1.Identifiers.PipeDefWithMeta, [
            util_2.typeWithParameters(metadata.type.type, metadata.typeArgumentCount),
            new o.ExpressionType(new o.LiteralExpr(metadata.pipeName)),
        ]));
    }
    exports.createPipeType = createPipeType;
    /**
     * Write a pipe definition to the output context.
     */
    function compilePipeFromRender2(outputCtx, pipe, reflector) {
        var name = compile_metadata_1.identifierName(pipe.type);
        if (!name) {
            return util_1.error("Cannot resolve the name of " + pipe.type);
        }
        var type = outputCtx.importExpr(pipe.type.reference);
        var metadata = {
            name: name,
            type: util_2.wrapReference(type),
            internalType: type,
            pipeName: pipe.name,
            typeArgumentCount: 0,
            deps: r3_factory_1.dependenciesFromGlobalMetadata(pipe.type, outputCtx, reflector),
            pure: pipe.pure,
        };
        var res = compilePipeFromMetadata(metadata);
        var factoryRes = r3_factory_1.compileFactoryFunction(tslib_1.__assign(tslib_1.__assign({}, metadata), { injectFn: r3_identifiers_1.Identifiers.directiveInject, target: r3_factory_1.R3FactoryTarget.Pipe }));
        var definitionField = outputCtx.constantPool.propertyNameOf(3 /* Pipe */);
        var ngFactoryDefStatement = new o.ClassStmt(
        /* name */ name, 
        /* parent */ null, 
        /* fields */
        [new o.ClassField(
            /* name */ 'ɵfac', 
            /* type */ o.INFERRED_TYPE, 
            /* modifiers */ [o.StmtModifier.Static], 
            /* initializer */ factoryRes.factory)], 
        /* getters */ [], 
        /* constructorMethod */ new o.ClassMethod(null, [], []), 
        /* methods */ []);
        var pipeDefStatement = new o.ClassStmt(
        /* name */ name, 
        /* parent */ null, 
        /* fields */ [new o.ClassField(
            /* name */ definitionField, 
            /* type */ o.INFERRED_TYPE, 
            /* modifiers */ [o.StmtModifier.Static], 
            /* initializer */ res.expression)], 
        /* getters */ [], 
        /* constructorMethod */ new o.ClassMethod(null, [], []), 
        /* methods */ []);
        outputCtx.statements.push(ngFactoryDefStatement, pipeDefStatement);
    }
    exports.compilePipeFromRender2 = compilePipeFromRender2;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfcGlwZV9jb21waWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9yZW5kZXIzL3IzX3BpcGVfY29tcGlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7OztJQUVILDJFQUF3RTtJQUd4RSwyREFBMEM7SUFDMUMsbURBQTZDO0lBRTdDLHVFQUEySDtJQUMzSCwrRUFBbUQ7SUFDbkQsMkRBQXNFO0lBNEN0RSxTQUFnQix1QkFBdUIsQ0FBQyxRQUF3QjtRQUM5RCxJQUFNLG1CQUFtQixHQUEwRCxFQUFFLENBQUM7UUFFdEYsd0JBQXdCO1FBQ3hCLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO1FBRTVGLHNCQUFzQjtRQUN0QixtQkFBbUIsQ0FBQyxJQUFJLENBQUMsRUFBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztRQUVuRixvQkFBb0I7UUFDcEIsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7UUFFeEYsSUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyw0QkFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENB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dEMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3RDLGFBQWEsQ0FBQSxFQUFFO1FBQ2YsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQ3ZELGFBQWEsQ0FBQSxFQUFFLENBQUMsQ0FBQztRQUVyQixTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUEvQ0Qsd0RBK0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcGlsZVBpcGVNZXRhZGF0YSwgaWRlbnRpZmllck5hbWV9IGZyb20gJy4uL2NvbXBpbGVfbWV0YWRhdGEnO1xuaW1wb3J0IHtDb21waWxlUmVmbGVjdG9yfSBmcm9tICcuLi9jb21waWxlX3JlZmxlY3Rvcic7XG5pbXBvcnQge0RlZmluaXRpb25LaW5kfSBmcm9tICcuLi9jb25zdGFudF9wb29sJztcbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtlcnJvciwgT3V0cHV0Q29udGV4dH0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7Y29tcGlsZUZhY3RvcnlGdW5jdGlvbiwgZGVwZW5kZW5jaWVzRnJvbUdsb2JhbE1ldGFkYXRhLCBSM0RlcGVuZGVuY3lNZXRhZGF0YSwgUjNGYWN0b3J5VGFyZ2V0fSBmcm9tICcuL3IzX2ZhY3RvcnknO1xuaW1wb3J0IHtJZGVudGlmaWVycyBhcyBSM30gZnJvbSAnLi9yM19pZGVudGlmaWVycyc7XG5pbXBvcnQge1IzUmVmZXJlbmNlLCB0eXBlV2l0aFBhcmFtZXRlcnMsIHdyYXBSZWZlcmVuY2V9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge1IzUGlwZURlZn0gZnJvbSAnLi92aWV3L2FwaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUjNQaXBlTWV0YWRhdGEge1xuICAvKipcbiAgICogTmFtZSBvZiB0aGUgcGlwZSB0eXBlLlxuICAgKi9cbiAgbmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBBbiBleHByZXNzaW9uIHJlcHJlc2VudGluZyBhIHJlZmVyZW5jZSB0byB0aGUgcGlwZSBpdHNlbGYuXG4gICAqL1xuICB0eXBlOiBSM1JlZmVyZW5jZTtcblxuICAvKipcbiAgICogQW4gZXhwcmVzc2lvbiByZXByZXNlbnRpbmcgdGhlIHBpcGUgYmVpbmcgY29tcGlsZWQsIGludGVuZGVkIGZvciB1c2Ugd2l0aGluIGEgY2xhc3MgZGVmaW5pdGlvblxuICAgKiBpdHNlbGYuXG4gICAqXG4gICAqIFRoaXMgY2FuIGRpZmZlciBmcm9tIHRoZSBvdXRlciBgdHlwZWAgaWYgdGhlIGNsYXNzIGlzIGJlaW5nIGNvbXBpbGVkIGJ5IG5nY2MgYW5kIGlzIGluc2lkZSBhblxuICAgKiBJSUZFIHN0cnVjdHVyZSB0aGF0IHVzZXMgYSBkaWZmZXJlbnQgbmFtZSBpbnRlcm5hbGx5LlxuICAgKi9cbiAgaW50ZXJuYWxUeXBlOiBvLkV4cHJlc3Npb247XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBnZW5lcmljIHR5cGUgcGFyYW1ldGVycyBvZiB0aGUgdHlwZSBpdHNlbGYuXG4gICAqL1xuICB0eXBlQXJndW1lbnRDb3VudDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBOYW1lIG9mIHRoZSBwaXBlLlxuICAgKi9cbiAgcGlwZU5hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogRGVwZW5kZW5jaWVzIG9mIHRoZSBwaXBlJ3MgY29uc3RydWN0b3IuXG4gICAqL1xuICBkZXBzOiBSM0RlcGVuZGVuY3lNZXRhZGF0YVtdfG51bGw7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHBpcGUgaXMgbWFya2VkIGFzIHB1cmUuXG4gICAqL1xuICBwdXJlOiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZVBpcGVGcm9tTWV0YWRhdGEobWV0YWRhdGE6IFIzUGlwZU1ldGFkYXRhKTogUjNQaXBlRGVmIHtcbiAgY29uc3QgZGVmaW5pdGlvbk1hcFZhbHVlczoge2tleTogc3RyaW5nLCBxdW90ZWQ6IGJvb2xlYW4sIHZhbHVlOiBvLkV4cHJlc3Npb259W10gPSBbXTtcblxuICAvLyBlLmcuIGBuYW1lOiAnbXlQaXBlJ2BcbiAgZGVmaW5pdGlvbk1hcFZhbHVlcy5wdXNoKHtrZXk6ICduYW1lJywgdmFsdWU6IG8ubGl0ZXJhbChtZXRhZGF0YS5waXBlTmFtZSksIHF1b3RlZDogZmFsc2V9KTtcblxuICAvLyBlLmcuIGB0eXBlOiBNeVBpcGVgXG4gIGRlZmluaXRpb25NYXBWYWx1ZXMucHVzaCh7a2V5OiAndHlwZScsIHZhbHVlOiBtZXRhZGF0YS50eXBlLnZhbHVlLCBxdW90ZWQ6IGZhbHNlfSk7XG5cbiAgLy8gZS5nLiBgcHVyZTogdHJ1ZWBcbiAgZGVmaW5pdGlvbk1hcFZhbHVlcy5wdXNoKHtrZXk6ICdwdXJlJywgdmFsdWU6IG8ubGl0ZXJhbChtZXRhZGF0YS5wdXJlKSwgcXVvdGVkOiBmYWxzZX0pO1xuXG4gIGNvbnN0IGV4cHJlc3Npb24gPSBvLmltcG9ydEV4cHIoUjMuZGVmaW5lUGlwZSkuY2FsbEZuKFtvLmxpdGVyYWxNYXAoZGVmaW5pdGlvbk1hcFZhbHVlcyldKTtcbiAgY29uc3QgdHlwZSA9IGNyZWF0ZVBpcGVUeXBlKG1ldGFkYXRhKTtcblxuICByZXR1cm4ge2V4cHJlc3Npb24sIHR5cGV9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGlwZVR5cGUobWV0YWRhdGE6IFIzUGlwZU1ldGFkYXRhKTogby5UeXBlIHtcbiAgcmV0dXJuIG5ldyBvLkV4cHJlc3Npb25UeXBlKG8uaW1wb3J0RXhwcihSMy5QaXBlRGVmV2l0aE1ldGEsIFtcbiAgICB0eXBlV2l0aFBhcmFtZXRlcnMobWV0YWRhdGEudHlwZS50eXBlLCBtZXRhZGF0YS50eXBlQXJndW1lbnRDb3VudCksXG4gICAgbmV3IG8uRXhwcmVzc2lvblR5cGUobmV3IG8uTGl0ZXJhbEV4cHIobWV0YWRhdGEucGlwZU5hbWUpKSxcbiAgXSkpO1xufVxuXG4vKipcbiAqIFdyaXRlIGEgcGlwZSBkZWZpbml0aW9uIHRvIHRoZSBvdXRwdXQgY29udGV4dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVQaXBlRnJvbVJlbmRlcjIoXG4gICAgb3V0cHV0Q3R4OiBPdXRwdXRDb250ZXh0LCBwaXBlOiBDb21waWxlUGlwZU1ldGFkYXRhLCByZWZsZWN0b3I6IENvbXBpbGVSZWZsZWN0b3IpIHtcbiAgY29uc3QgbmFtZSA9IGlkZW50aWZpZXJOYW1lKHBpcGUudHlwZSk7XG5cbiAgaWYgKCFuYW1lKSB7XG4gICAgcmV0dXJuIGVycm9yKGBDYW5ub3QgcmVzb2x2ZSB0aGUgbmFtZSBvZiAke3BpcGUudHlwZX1gKTtcbiAgfVxuXG4gIGNvbnN0IHR5cGUgPSBvdXRwdXRDdHguaW1wb3J0RXhwcihwaXBlLnR5cGUucmVmZXJlbmNlKTtcbiAgY29uc3QgbWV0YWRhdGE6IFIzUGlwZU1ldGFkYXRhID0ge1xuICAgIG5hbWUsXG4gICAgdHlwZTogd3JhcFJlZmVyZW5jZSh0eXBlKSxcbiAgICBpbnRlcm5hbFR5cGU6IHR5cGUsXG4gICAgcGlwZU5hbWU6IHBpcGUubmFtZSxcbiAgICB0eXBlQXJndW1lbnRDb3VudDogMCxcbiAgICBkZXBzOiBkZXBlbmRlbmNpZXNGcm9tR2xvYmFsTWV0YWRhdGEocGlwZS50eXBlLCBvdXRwdXRDdHgsIHJlZmxlY3RvciksXG4gICAgcHVyZTogcGlwZS5wdXJlLFxuICB9O1xuICBjb25zdCByZXMgPSBjb21waWxlUGlwZUZyb21NZXRhZGF0YShtZXRhZGF0YSk7XG4gIGNvbnN0IGZhY3RvcnlSZXMgPSBjb21waWxlRmFjdG9yeUZ1bmN0aW9uKFxuICAgICAgey4uLm1ldGFkYXRhLCBpbmplY3RGbjogUjMuZGlyZWN0aXZlSW5qZWN0LCB0YXJnZXQ6IFIzRmFjdG9yeVRhcmdldC5QaXBlfSk7XG4gIGNvbnN0IGRlZmluaXRpb25GaWVsZCA9IG91dHB1dEN0eC5jb25zdGFudFBvb2wucHJvcGVydHlOYW1lT2YoRGVmaW5pdGlvbktpbmQuUGlwZSk7XG4gIGNvbnN0IG5nRmFjdG9yeURlZlN0YXRlbWVudCA9IG5ldyBvLkNsYXNzU3RtdChcbiAgICAgIC8qIG5hbWUgKi8gbmFtZSxcbiAgICAgIC8qIHBhcmVudCAqLyBudWxsLFxuICAgICAgLyogZmllbGRzICovXG4gICAgICBbbmV3IG8uQ2xhc3NGaWVsZChcbiAgICAgICAgICAvKiBuYW1lICovICfJtWZhYycsXG4gICAgICAgICAgLyogdHlwZSAqLyBvLklORkVSUkVEX1RZUEUsXG4gICAgICAgICAgLyogbW9kaWZpZXJzICovW28uU3RtdE1vZGlmaWVyLlN0YXRpY10sXG4gICAgICAgICAgLyogaW5pdGlhbGl6ZXIgKi8gZmFjdG9yeVJlcy5mYWN0b3J5KV0sXG4gICAgICAvKiBnZXR0ZXJzICovW10sXG4gICAgICAvKiBjb25zdHJ1Y3Rvck1ldGhvZCAqLyBuZXcgby5DbGFzc01ldGhvZChudWxsLCBbXSwgW10pLFxuICAgICAgLyogbWV0aG9kcyAqL1tdKTtcbiAgY29uc3QgcGlwZURlZlN0YXRlbWVudCA9IG5ldyBvLkNsYXNzU3RtdChcbiAgICAgIC8qIG5hbWUgKi8gbmFtZSxcbiAgICAgIC8qIHBhcmVudCAqLyBudWxsLFxuICAgICAgLyogZmllbGRzICovW25ldyBvLkNsYXNzRmllbGQoXG4gICAgICAgICAgLyogbmFtZSAqLyBkZWZpbml0aW9uRmllbGQsXG4gICAgICAgICAgLyogdHlwZSAqLyBvLklORkVSUkVEX1RZUEUsXG4gICAgICAgICAgLyogbW9kaWZpZXJzICovW28uU3RtdE1vZGlmaWVyLlN0YXRpY10sXG4gICAgICAgICAgLyogaW5pdGlhbGl6ZXIgKi8gcmVzLmV4cHJlc3Npb24pXSxcbiAgICAgIC8qIGdldHRlcnMgKi9bXSxcbiAgICAgIC8qIGNvbnN0cnVjdG9yTWV0aG9kICovIG5ldyBvLkNsYXNzTWV0aG9kKG51bGwsIFtdLCBbXSksXG4gICAgICAvKiBtZXRob2RzICovW10pO1xuXG4gIG91dHB1dEN0eC5zdGF0ZW1lbnRzLnB1c2gobmdGYWN0b3J5RGVmU3RhdGVtZW50LCBwaXBlRGVmU3RhdGVtZW50KTtcbn1cbiJdfQ==