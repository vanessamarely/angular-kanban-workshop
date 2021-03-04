(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/ngcc/src/analysis/decoration_analyzer", ["require", "exports", "tslib", "@angular/compiler", "@angular/compiler-cli/src/ngtsc/annotations", "@angular/compiler-cli/src/ngtsc/cycles", "@angular/compiler-cli/src/ngtsc/diagnostics", "@angular/compiler-cli/src/ngtsc/file_system", "@angular/compiler-cli/src/ngtsc/imports", "@angular/compiler-cli/src/ngtsc/metadata", "@angular/compiler-cli/src/ngtsc/partial_evaluator", "@angular/compiler-cli/src/ngtsc/scope", "@angular/compiler-cli/ngcc/src/migrations/missing_injectable_migration", "@angular/compiler-cli/ngcc/src/migrations/undecorated_child_migration", "@angular/compiler-cli/ngcc/src/migrations/undecorated_parent_migration", "@angular/compiler-cli/ngcc/src/analysis/migration_host", "@angular/compiler-cli/ngcc/src/analysis/ngcc_trait_compiler", "@angular/compiler-cli/ngcc/src/analysis/types", "@angular/compiler-cli/ngcc/src/analysis/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecorationAnalyzer = void 0;
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var compiler_1 = require("@angular/compiler");
    var annotations_1 = require("@angular/compiler-cli/src/ngtsc/annotations");
    var cycles_1 = require("@angular/compiler-cli/src/ngtsc/cycles");
    var diagnostics_1 = require("@angular/compiler-cli/src/ngtsc/diagnostics");
    var file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system");
    var imports_1 = require("@angular/compiler-cli/src/ngtsc/imports");
    var metadata_1 = require("@angular/compiler-cli/src/ngtsc/metadata");
    var partial_evaluator_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator");
    var scope_1 = require("@angular/compiler-cli/src/ngtsc/scope");
    var missing_injectable_migration_1 = require("@angular/compiler-cli/ngcc/src/migrations/missing_injectable_migration");
    var undecorated_child_migration_1 = require("@angular/compiler-cli/ngcc/src/migrations/undecorated_child_migration");
    var undecorated_parent_migration_1 = require("@angular/compiler-cli/ngcc/src/migrations/undecorated_parent_migration");
    var migration_host_1 = require("@angular/compiler-cli/ngcc/src/analysis/migration_host");
    var ngcc_trait_compiler_1 = require("@angular/compiler-cli/ngcc/src/analysis/ngcc_trait_compiler");
    var types_1 = require("@angular/compiler-cli/ngcc/src/analysis/types");
    var util_1 = require("@angular/compiler-cli/ngcc/src/analysis/util");
    /**
     * Simple class that resolves and loads files directly from the filesystem.
     */
    var NgccResourceLoader = /** @class */ (function () {
        function NgccResourceLoader(fs) {
            this.fs = fs;
            this.canPreload = false;
        }
        NgccResourceLoader.prototype.preload = function () {
            throw new Error('Not implemented.');
        };
        NgccResourceLoader.prototype.load = function (url) {
            return this.fs.readFile(this.fs.resolve(url));
        };
        NgccResourceLoader.prototype.resolve = function (url, containingFile) {
            return this.fs.resolve(this.fs.dirname(containingFile), url);
        };
        return NgccResourceLoader;
    }());
    /**
     * This Analyzer will analyze the files that have decorated classes that need to be transformed.
     */
    var DecorationAnalyzer = /** @class */ (function () {
        function DecorationAnalyzer(fs, bundle, reflectionHost, referencesRegistry, diagnosticHandler, tsConfig) {
            if (diagnosticHandler === void 0) { diagnosticHandler = function () { }; }
            if (tsConfig === void 0) { tsConfig = null; }
            this.fs = fs;
            this.bundle = bundle;
            this.reflectionHost = reflectionHost;
            this.referencesRegistry = referencesRegistry;
            this.diagnosticHandler = diagnosticHandler;
            this.tsConfig = tsConfig;
            this.program = this.bundle.src.program;
            this.options = this.bundle.src.options;
            this.host = this.bundle.src.host;
            this.typeChecker = this.bundle.src.program.getTypeChecker();
            this.rootDirs = this.bundle.rootDirs;
            this.packagePath = this.bundle.entryPoint.packagePath;
            this.isCore = this.bundle.isCore;
            this.compilerOptions = this.tsConfig !== null ? this.tsConfig.options : {};
            this.moduleResolver = new imports_1.ModuleResolver(this.program, this.options, this.host, /* moduleResolutionCache */ null);
            this.resourceManager = new NgccResourceLoader(this.fs);
            this.metaRegistry = new metadata_1.LocalMetadataRegistry();
            this.dtsMetaReader = new metadata_1.DtsMetadataReader(this.typeChecker, this.reflectionHost);
            this.fullMetaReader = new metadata_1.CompoundMetadataReader([this.metaRegistry, this.dtsMetaReader]);
            this.refEmitter = new imports_1.ReferenceEmitter([
                new imports_1.LocalIdentifierStrategy(),
                new imports_1.AbsoluteModuleStrategy(this.program, this.typeChecker, this.moduleResolver, this.reflectionHost),
                // TODO(alxhub): there's no reason why ngcc needs the "logical file system" logic here, as ngcc
                // projects only ever have one rootDir. Instead, ngcc should just switch its emitted import
                // based on whether a bestGuessOwningModule is present in the Reference.
                new imports_1.LogicalProjectStrategy(this.reflectionHost, new file_system_1.LogicalFileSystem(this.rootDirs, this.host)),
            ]);
            this.aliasingHost = this.bundle.entryPoint.generateDeepReexports ?
                new imports_1.PrivateExportAliasingHost(this.reflectionHost) :
                null;
            this.dtsModuleScopeResolver = new scope_1.MetadataDtsModuleScopeResolver(this.dtsMetaReader, this.aliasingHost);
            this.scopeRegistry = new scope_1.LocalModuleScopeRegistry(this.metaRegistry, this.dtsModuleScopeResolver, this.refEmitter, this.aliasingHost);
            this.fullRegistry = new metadata_1.CompoundMetadataRegistry([this.metaRegistry, this.scopeRegistry]);
            this.evaluator = new partial_evaluator_1.PartialEvaluator(this.reflectionHost, this.typeChecker, /* dependencyTracker */ null);
            this.importGraph = new cycles_1.ImportGraph(this.moduleResolver);
            this.cycleAnalyzer = new cycles_1.CycleAnalyzer(this.importGraph);
            this.injectableRegistry = new metadata_1.InjectableClassRegistry(this.reflectionHost);
            this.typeCheckScopeRegistry = new scope_1.TypeCheckScopeRegistry(this.scopeRegistry, this.fullMetaReader);
            this.handlers = [
                new annotations_1.ComponentDecoratorHandler(this.reflectionHost, this.evaluator, this.fullRegistry, this.fullMetaReader, this.scopeRegistry, this.scopeRegistry, this.typeCheckScopeRegistry, new metadata_1.ResourceRegistry(), this.isCore, this.resourceManager, this.rootDirs, !!this.compilerOptions.preserveWhitespaces, 
                /* i18nUseExternalIds */ true, this.bundle.enableI18nLegacyMessageIdFormat, 
                /* usePoisonedData */ false, 
                /* i18nNormalizeLineEndingsInICUs */ false, this.moduleResolver, this.cycleAnalyzer, 0 /* UseRemoteScoping */, this.refEmitter, imports_1.NOOP_DEFAULT_IMPORT_RECORDER, util_1.NOOP_DEPENDENCY_TRACKER, this.injectableRegistry, !!this.compilerOptions.annotateForClosureCompiler),
                // See the note in ngtsc about why this cast is needed.
                // clang-format off
                new annotations_1.DirectiveDecoratorHandler(this.reflectionHost, this.evaluator, this.fullRegistry, this.scopeRegistry, this.fullMetaReader, imports_1.NOOP_DEFAULT_IMPORT_RECORDER, this.injectableRegistry, this.isCore, !!this.compilerOptions.annotateForClosureCompiler, 
                // In ngcc we want to compile undecorated classes with Angular features. As of
                // version 10, undecorated classes that use Angular features are no longer handled
                // in ngtsc, but we want to ensure compatibility in ngcc for outdated libraries that
                // have not migrated to explicit decorators. See: https://hackmd.io/@alx/ryfYYuvzH.
                /* compileUndecoratedClassesWithAngularFeatures */ true),
                // clang-format on
                // Pipe handler must be before injectable handler in list so pipe factories are printed
                // before injectable factories (so injectable factories can delegate to them)
                new annotations_1.PipeDecoratorHandler(this.reflectionHost, this.evaluator, this.metaRegistry, this.scopeRegistry, imports_1.NOOP_DEFAULT_IMPORT_RECORDER, this.injectableRegistry, this.isCore),
                new annotations_1.InjectableDecoratorHandler(this.reflectionHost, imports_1.NOOP_DEFAULT_IMPORT_RECORDER, this.isCore, 
                /* strictCtorDeps */ false, this.injectableRegistry, /* errorOnDuplicateProv */ false),
                new annotations_1.NgModuleDecoratorHandler(this.reflectionHost, this.evaluator, this.fullMetaReader, this.fullRegistry, this.scopeRegistry, this.referencesRegistry, this.isCore, /* routeAnalyzer */ null, this.refEmitter, 
                /* factoryTracker */ null, imports_1.NOOP_DEFAULT_IMPORT_RECORDER, !!this.compilerOptions.annotateForClosureCompiler, this.injectableRegistry),
            ];
            this.compiler = new ngcc_trait_compiler_1.NgccTraitCompiler(this.handlers, this.reflectionHost);
            this.migrations = [
                new undecorated_parent_migration_1.UndecoratedParentMigration(),
                new undecorated_child_migration_1.UndecoratedChildMigration(),
                new missing_injectable_migration_1.MissingInjectableMigration(),
            ];
        }
        /**
         * Analyze a program to find all the decorated files should be transformed.
         *
         * @returns a map of the source files to the analysis for those files.
         */
        DecorationAnalyzer.prototype.analyzeProgram = function () {
            var e_1, _a, e_2, _b;
            try {
                for (var _c = tslib_1.__values(this.program.getSourceFiles()), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var sourceFile = _d.value;
                    if (!sourceFile.isDeclarationFile &&
                        util_1.isWithinPackage(this.packagePath, file_system_1.absoluteFromSourceFile(sourceFile))) {
                        this.compiler.analyzeFile(sourceFile);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            this.applyMigrations();
            this.compiler.resolve();
            this.reportDiagnostics();
            var decorationAnalyses = new types_1.DecorationAnalyses();
            try {
                for (var _e = tslib_1.__values(this.compiler.analyzedFiles), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var analyzedFile = _f.value;
                    var compiledFile = this.compileFile(analyzedFile);
                    decorationAnalyses.set(compiledFile.sourceFile, compiledFile);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return decorationAnalyses;
        };
        DecorationAnalyzer.prototype.applyMigrations = function () {
            var _this = this;
            var migrationHost = new migration_host_1.DefaultMigrationHost(this.reflectionHost, this.fullMetaReader, this.evaluator, this.compiler, this.bundle.entryPoint.path);
            this.migrations.forEach(function (migration) {
                _this.compiler.analyzedFiles.forEach(function (analyzedFile) {
                    var records = _this.compiler.recordsFor(analyzedFile);
                    if (records === null) {
                        throw new Error('Assertion error: file to migrate must have records.');
                    }
                    records.forEach(function (record) {
                        var addDiagnostic = function (diagnostic) {
                            if (record.metaDiagnostics === null) {
                                record.metaDiagnostics = [];
                            }
                            record.metaDiagnostics.push(diagnostic);
                        };
                        try {
                            var result = migration.apply(record.node, migrationHost);
                            if (result !== null) {
                                addDiagnostic(result);
                            }
                        }
                        catch (e) {
                            if (diagnostics_1.isFatalDiagnosticError(e)) {
                                addDiagnostic(e.toDiagnostic());
                            }
                            else {
                                throw e;
                            }
                        }
                    });
                });
            });
        };
        DecorationAnalyzer.prototype.reportDiagnostics = function () {
            this.compiler.diagnostics.forEach(this.diagnosticHandler);
        };
        DecorationAnalyzer.prototype.compileFile = function (sourceFile) {
            var e_3, _a;
            var constantPool = new compiler_1.ConstantPool();
            var records = this.compiler.recordsFor(sourceFile);
            if (records === null) {
                throw new Error('Assertion error: file to compile must have records.');
            }
            var compiledClasses = [];
            try {
                for (var records_1 = tslib_1.__values(records), records_1_1 = records_1.next(); !records_1_1.done; records_1_1 = records_1.next()) {
                    var record = records_1_1.value;
                    var compilation = this.compiler.compile(record.node, constantPool);
                    if (compilation === null) {
                        continue;
                    }
                    compiledClasses.push({
                        name: record.node.name.text,
                        decorators: this.compiler.getAllDecorators(record.node),
                        declaration: record.node,
                        compilation: compilation
                    });
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (records_1_1 && !records_1_1.done && (_a = records_1.return)) _a.call(records_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
            var reexports = this.getReexportsForSourceFile(sourceFile);
            return { constantPool: constantPool, sourceFile: sourceFile, compiledClasses: compiledClasses, reexports: reexports };
        };
        DecorationAnalyzer.prototype.getReexportsForSourceFile = function (sf) {
            var exportStatements = this.compiler.exportStatements;
            if (!exportStatements.has(sf.fileName)) {
                return [];
            }
            var exports = exportStatements.get(sf.fileName);
            var reexports = [];
            exports.forEach(function (_a, asAlias) {
                var _b = tslib_1.__read(_a, 2), fromModule = _b[0], symbolName = _b[1];
                reexports.push({ asAlias: asAlias, fromModule: fromModule, symbolName: symbolName });
            });
            return reexports;
        };
        return DecorationAnalyzer;
    }());
    exports.DecorationAnalyzer = DecorationAnalyzer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvbl9hbmFseXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9uZ2NjL3NyYy9hbmFseXNpcy9kZWNvcmF0aW9uX2FuYWx5emVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCw4Q0FBK0M7SUFJL0MsMkVBQW9OO0lBQ3BOLGlFQUE0RjtJQUM1RiwyRUFBc0U7SUFDdEUsMkVBQTZHO0lBQzdHLG1FQUF3TjtJQUN4TixxRUFBa0w7SUFDbEwsdUZBQXNFO0lBQ3RFLCtEQUEwSDtJQUkxSCx1SEFBc0Y7SUFDdEYscUhBQW9GO0lBQ3BGLHVIQUFzRjtJQUd0Rix5RkFBc0Q7SUFDdEQsbUdBQXdEO0lBQ3hELHVFQUF3RTtJQUN4RSxxRUFBZ0U7SUFJaEU7O09BRUc7SUFDSDtRQUNFLDRCQUFvQixFQUFzQjtZQUF0QixPQUFFLEdBQUYsRUFBRSxDQUFvQjtZQUMxQyxlQUFVLEdBQUcsS0FBSyxDQUFDO1FBRDBCLENBQUM7UUFFOUMsb0NBQU8sR0FBUDtZQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBQ0QsaUNBQUksR0FBSixVQUFLLEdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUNELG9DQUFPLEdBQVAsVUFBUSxHQUFXLEVBQUUsY0FBc0I7WUFDekMsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBQ0gseUJBQUM7SUFBRCxDQUFDLEFBWkQsSUFZQztJQUVE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WUFBQSxFQUFFLFVBQVUsWUFBQSxFQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sU0FBUyxDQUFDO1FBQ25CLENBQUM7UUFDSCx5QkFBQztJQUFELENBQUMsQUF6TUQsSUF5TUM7SUF6TVksZ0RBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0NvbnN0YW50UG9vbH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7UGFyc2VkQ29uZmlndXJhdGlvbn0gZnJvbSAnLi4vLi4vLi4nO1xuaW1wb3J0IHtDb21wb25lbnREZWNvcmF0b3JIYW5kbGVyLCBEaXJlY3RpdmVEZWNvcmF0b3JIYW5kbGVyLCBJbmplY3RhYmxlRGVjb3JhdG9ySGFuZGxlciwgTmdNb2R1bGVEZWNvcmF0b3JIYW5kbGVyLCBQaXBlRGVjb3JhdG9ySGFuZGxlciwgUmVmZXJlbmNlc1JlZ2lzdHJ5LCBSZXNvdXJjZUxvYWRlcn0gZnJvbSAnLi4vLi4vLi4vc3JjL25ndHNjL2Fubm90YXRpb25zJztcbmltcG9ydCB7Q3ljbGVBbmFseXplciwgQ3ljbGVIYW5kbGluZ1N0cmF0ZWd5LCBJbXBvcnRHcmFwaH0gZnJvbSAnLi4vLi4vLi4vc3JjL25ndHNjL2N5Y2xlcyc7XG5pbXBvcnQge2lzRmF0YWxEaWFnbm9zdGljRXJyb3J9IGZyb20gJy4uLy4uLy4uL3NyYy9uZ3RzYy9kaWFnbm9zdGljcyc7XG5pbXBvcnQge2Fic29sdXRlRnJvbVNvdXJjZUZpbGUsIExvZ2ljYWxGaWxlU3lzdGVtLCBSZWFkb25seUZpbGVTeXN0ZW19IGZyb20gJy4uLy4uLy4uL3NyYy9uZ3RzYy9maWxlX3N5c3RlbSc7XG5pbXBvcnQge0Fic29sdXRlTW9kdWxlU3RyYXRlZ3ksIExvY2FsSWRlbnRpZmllclN0cmF0ZWd5LCBMb2dpY2FsUHJvamVjdFN0cmF0ZWd5LCBNb2R1bGVSZXNvbHZlciwgTk9PUF9ERUZBVUxUX0lNUE9SVF9SRUNPUkRFUiwgUHJpdmF0ZUV4cG9ydEFsaWFzaW5nSG9zdCwgUmVleHBvcnQsIFJlZmVyZW5jZUVtaXR0ZXJ9IGZyb20gJy4uLy4uLy4uL3NyYy9uZ3RzYy9pbXBvcnRzJztcbmltcG9ydCB7Q29tcG91bmRNZXRhZGF0YVJlYWRlciwgQ29tcG91bmRNZXRhZGF0YVJlZ2lzdHJ5LCBEdHNNZXRhZGF0YVJlYWRlciwgSW5qZWN0YWJsZUNsYXNzUmVnaXN0cnksIExvY2FsTWV0YWRhdGFSZWdpc3RyeSwgUmVzb3VyY2VSZWdpc3RyeX0gZnJvbSAnLi4vLi4vLi4vc3JjL25ndHNjL21ldGFkYXRhJztcbmltcG9ydCB7UGFydGlhbEV2YWx1YXRvcn0gZnJvbSAnLi4vLi4vLi4vc3JjL25ndHNjL3BhcnRpYWxfZXZhbHVhdG9yJztcbmltcG9ydCB7TG9jYWxNb2R1bGVTY29wZVJlZ2lzdHJ5LCBNZXRhZGF0YUR0c01vZHVsZVNjb3BlUmVzb2x2ZXIsIFR5cGVDaGVja1Njb3BlUmVnaXN0cnl9IGZyb20gJy4uLy4uLy4uL3NyYy9uZ3RzYy9zY29wZSc7XG5pbXBvcnQge0RlY29yYXRvckhhbmRsZXJ9IGZyb20gJy4uLy4uLy4uL3NyYy9uZ3RzYy90cmFuc2Zvcm0nO1xuaW1wb3J0IHtOZ2NjUmVmbGVjdGlvbkhvc3R9IGZyb20gJy4uL2hvc3QvbmdjY19ob3N0JztcbmltcG9ydCB7TWlncmF0aW9ufSBmcm9tICcuLi9taWdyYXRpb25zL21pZ3JhdGlvbic7XG5pbXBvcnQge01pc3NpbmdJbmplY3RhYmxlTWlncmF0aW9ufSBmcm9tICcuLi9taWdyYXRpb25zL21pc3NpbmdfaW5qZWN0YWJsZV9taWdyYXRpb24nO1xuaW1wb3J0IHtVbmRlY29yYXRlZENoaWxkTWlncmF0aW9ufSBmcm9tICcuLi9taWdyYXRpb25zL3VuZGVjb3JhdGVkX2NoaWxkX21pZ3JhdGlvbic7XG5pbXBvcnQge1VuZGVjb3JhdGVkUGFyZW50TWlncmF0aW9ufSBmcm9tICcuLi9taWdyYXRpb25zL3VuZGVjb3JhdGVkX3BhcmVudF9taWdyYXRpb24nO1xuaW1wb3J0IHtFbnRyeVBvaW50QnVuZGxlfSBmcm9tICcuLi9wYWNrYWdlcy9lbnRyeV9wb2ludF9idW5kbGUnO1xuXG5pbXBvcnQge0RlZmF1bHRNaWdyYXRpb25Ib3N0fSBmcm9tICcuL21pZ3JhdGlvbl9ob3N0JztcbmltcG9ydCB7TmdjY1RyYWl0Q29tcGlsZXJ9IGZyb20gJy4vbmdjY190cmFpdF9jb21waWxlcic7XG5pbXBvcnQge0NvbXBpbGVkQ2xhc3MsIENvbXBpbGVkRmlsZSwgRGVjb3JhdGlvbkFuYWx5c2VzfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7aXNXaXRoaW5QYWNrYWdlLCBOT09QX0RFUEVOREVOQ1lfVFJBQ0tFUn0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogU2ltcGxlIGNsYXNzIHRoYXQgcmVzb2x2ZXMgYW5kIGxvYWRzIGZpbGVzIGRpcmVjdGx5IGZyb20gdGhlIGZpbGVzeXN0ZW0uXG4gKi9cbmNsYXNzIE5nY2NSZXNvdXJjZUxvYWRlciBpbXBsZW1lbnRzIFJlc291cmNlTG9hZGVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBmczogUmVhZG9ubHlGaWxlU3lzdGVtKSB7fVxuICBjYW5QcmVsb2FkID0gZmFsc2U7XG4gIHByZWxvYWQoKTogdW5kZWZpbmVkfFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkLicpO1xuICB9XG4gIGxvYWQodXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmZzLnJlYWRGaWxlKHRoaXMuZnMucmVzb2x2ZSh1cmwpKTtcbiAgfVxuICByZXNvbHZlKHVybDogc3RyaW5nLCBjb250YWluaW5nRmlsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5mcy5yZXNvbHZlKHRoaXMuZnMuZGlybmFtZShjb250YWluaW5nRmlsZSksIHVybCk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGlzIEFuYWx5emVyIHdpbGwgYW5hbHl6ZSB0aGUgZmlsZXMgdGhhdCBoYXZlIGRlY29yYXRlZCBjbGFzc2VzIHRoYXQgbmVlZCB0byBiZSB0cmFuc2Zvcm1lZC5cbiAqL1xuZXhwb3J0IGNsYXNzIERlY29yYXRpb25BbmFseXplciB7XG4gIHByaXZhdGUgcHJvZ3JhbSA9IHRoaXMuYnVuZGxlLnNyYy5wcm9ncmFtO1xuICBwcml2YXRlIG9wdGlvbnMgPSB0aGlzLmJ1bmRsZS5zcmMub3B0aW9ucztcbiAgcHJpdmF0ZSBob3N0ID0gdGhpcy5idW5kbGUuc3JjLmhvc3Q7XG4gIHByaXZhdGUgdHlwZUNoZWNrZXIgPSB0aGlzLmJ1bmRsZS5zcmMucHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBwcml2YXRlIHJvb3REaXJzID0gdGhpcy5idW5kbGUucm9vdERpcnM7XG4gIHByaXZhdGUgcGFja2FnZVBhdGggPSB0aGlzLmJ1bmRsZS5lbnRyeVBvaW50LnBhY2thZ2VQYXRoO1xuICBwcml2YXRlIGlzQ29yZSA9IHRoaXMuYnVuZGxlLmlzQ29yZTtcbiAgcHJpdmF0ZSBjb21waWxlck9wdGlvbnMgPSB0aGlzLnRzQ29uZmlnICE9PSBudWxsID8gdGhpcy50c0NvbmZpZy5vcHRpb25zIDoge307XG5cbiAgbW9kdWxlUmVzb2x2ZXIgPVxuICAgICAgbmV3IE1vZHVsZVJlc29sdmVyKHRoaXMucHJvZ3JhbSwgdGhpcy5vcHRpb25zLCB0aGlzLmhvc3QsIC8qIG1vZHVsZVJlc29sdXRpb25DYWNoZSAqLyBudWxsKTtcbiAgcmVzb3VyY2VNYW5hZ2VyID0gbmV3IE5nY2NSZXNvdXJjZUxvYWRlcih0aGlzLmZzKTtcbiAgbWV0YVJlZ2lzdHJ5ID0gbmV3IExvY2FsTWV0YWRhdGFSZWdpc3RyeSgpO1xuICBkdHNNZXRhUmVhZGVyID0gbmV3IER0c01ldGFkYXRhUmVhZGVyKHRoaXMudHlwZUNoZWNrZXIsIHRoaXMucmVmbGVjdGlvbkhvc3QpO1xuICBmdWxsTWV0YVJlYWRlciA9IG5ldyBDb21wb3VuZE1ldGFkYXRhUmVhZGVyKFt0aGlzLm1ldGFSZWdpc3RyeSwgdGhpcy5kdHNNZXRhUmVhZGVyXSk7XG4gIHJlZkVtaXR0ZXIgPSBuZXcgUmVmZXJlbmNlRW1pdHRlcihbXG4gICAgbmV3IExvY2FsSWRlbnRpZmllclN0cmF0ZWd5KCksXG4gICAgbmV3IEFic29sdXRlTW9kdWxlU3RyYXRlZ3koXG4gICAgICAgIHRoaXMucHJvZ3JhbSwgdGhpcy50eXBlQ2hlY2tlciwgdGhpcy5tb2R1bGVSZXNvbHZlciwgdGhpcy5yZWZsZWN0aW9uSG9zdCksXG4gICAgLy8gVE9ETyhhbHhodWIpOiB0aGVyZSdzIG5vIHJlYXNvbiB3aHkgbmdjYyBuZWVkcyB0aGUgXCJsb2dpY2FsIGZpbGUgc3lzdGVtXCIgbG9naWMgaGVyZSwgYXMgbmdjY1xuICAgIC8vIHByb2plY3RzIG9ubHkgZXZlciBoYXZlIG9uZSByb290RGlyLiBJbnN0ZWFkLCBuZ2NjIHNob3VsZCBqdXN0IHN3aXRjaCBpdHMgZW1pdHRlZCBpbXBvcnRcbiAgICAvLyBiYXNlZCBvbiB3aGV0aGVyIGEgYmVzdEd1ZXNzT3duaW5nTW9kdWxlIGlzIHByZXNlbnQgaW4gdGhlIFJlZmVyZW5jZS5cbiAgICBuZXcgTG9naWNhbFByb2plY3RTdHJhdGVneShcbiAgICAgICAgdGhpcy5yZWZsZWN0aW9uSG9zdCwgbmV3IExvZ2ljYWxGaWxlU3lzdGVtKHRoaXMucm9vdERpcnMsIHRoaXMuaG9zdCkpLFxuICBdKTtcbiAgYWxpYXNpbmdIb3N0ID0gdGhpcy5idW5kbGUuZW50cnlQb2ludC5nZW5lcmF0ZURlZXBSZWV4cG9ydHMgP1xuICAgICAgbmV3IFByaXZhdGVFeHBvcnRBbGlhc2luZ0hvc3QodGhpcy5yZWZsZWN0aW9uSG9zdCkgOlxuICAgICAgbnVsbDtcbiAgZHRzTW9kdWxlU2NvcGVSZXNvbHZlciA9XG4gICAgICBuZXcgTWV0YWRhdGFEdHNNb2R1bGVTY29wZVJlc29sdmVyKHRoaXMuZHRzTWV0YVJlYWRlciwgdGhpcy5hbGlhc2luZ0hvc3QpO1xuICBzY29wZVJlZ2lzdHJ5ID0gbmV3IExvY2FsTW9kdWxlU2NvcGVSZWdpc3RyeShcbiAgICAgIHRoaXMubWV0YVJlZ2lzdHJ5LCB0aGlzLmR0c01vZHVsZVNjb3BlUmVzb2x2ZXIsIHRoaXMucmVmRW1pdHRlciwgdGhpcy5hbGlhc2luZ0hvc3QpO1xuICBmdWxsUmVnaXN0cnkgPSBuZXcgQ29tcG91bmRNZXRhZGF0YVJlZ2lzdHJ5KFt0aGlzLm1ldGFSZWdpc3RyeSwgdGhpcy5zY29wZVJlZ2lzdHJ5XSk7XG4gIGV2YWx1YXRvciA9XG4gICAgICBuZXcgUGFydGlhbEV2YWx1YXRvcih0aGlzLnJlZmxlY3Rpb25Ib3N0LCB0aGlzLnR5cGVDaGVja2VyLCAvKiBkZXBlbmRlbmN5VHJhY2tlciAqLyBudWxsKTtcbiAgaW1wb3J0R3JhcGggPSBuZXcgSW1wb3J0R3JhcGgodGhpcy5tb2R1bGVSZXNvbHZlcik7XG4gIGN5Y2xlQW5hbHl6ZXIgPSBuZXcgQ3ljbGVBbmFseXplcih0aGlzLmltcG9ydEdyYXBoKTtcbiAgaW5qZWN0YWJsZVJlZ2lzdHJ5ID0gbmV3IEluamVjdGFibGVDbGFzc1JlZ2lzdHJ5KHRoaXMucmVmbGVjdGlvbkhvc3QpO1xuICB0eXBlQ2hlY2tTY29wZVJlZ2lzdHJ5ID0gbmV3IFR5cGVDaGVja1Njb3BlUmVnaXN0cnkodGhpcy5zY29wZVJlZ2lzdHJ5LCB0aGlzLmZ1bGxNZXRhUmVhZGVyKTtcbiAgaGFuZGxlcnM6IERlY29yYXRvckhhbmRsZXI8dW5rbm93biwgdW5rbm93biwgdW5rbm93bj5bXSA9IFtcbiAgICBuZXcgQ29tcG9uZW50RGVjb3JhdG9ySGFuZGxlcihcbiAgICAgICAgdGhpcy5yZWZsZWN0aW9uSG9zdCwgdGhpcy5ldmFsdWF0b3IsIHRoaXMuZnVsbFJlZ2lzdHJ5LCB0aGlzLmZ1bGxNZXRhUmVhZGVyLFxuICAgICAgICB0aGlzLnNjb3BlUmVnaXN0cnksIHRoaXMuc2NvcGVSZWdpc3RyeSwgdGhpcy50eXBlQ2hlY2tTY29wZVJlZ2lzdHJ5LCBuZXcgUmVzb3VyY2VSZWdpc3RyeSgpLFxuICAgICAgICB0aGlzLmlzQ29yZSwgdGhpcy5yZXNvdXJjZU1hbmFnZXIsIHRoaXMucm9vdERpcnMsXG4gICAgICAgICEhdGhpcy5jb21waWxlck9wdGlvbnMucHJlc2VydmVXaGl0ZXNwYWNlcyxcbiAgICAgICAgLyogaTE4blVzZUV4dGVybmFsSWRzICovIHRydWUsIHRoaXMuYnVuZGxlLmVuYWJsZUkxOG5MZWdhY3lNZXNzYWdlSWRGb3JtYXQsXG4gICAgICAgIC8qIHVzZVBvaXNvbmVkRGF0YSAqLyBmYWxzZSxcbiAgICAgICAgLyogaTE4bk5vcm1hbGl6ZUxpbmVFbmRpbmdzSW5JQ1VzICovIGZhbHNlLCB0aGlzLm1vZHVsZVJlc29sdmVyLCB0aGlzLmN5Y2xlQW5hbHl6ZXIsXG4gICAgICAgIEN5Y2xlSGFuZGxpbmdTdHJhdGVneS5Vc2VSZW1vdGVTY29waW5nLCB0aGlzLnJlZkVtaXR0ZXIsIE5PT1BfREVGQVVMVF9JTVBPUlRfUkVDT1JERVIsXG4gICAgICAgIE5PT1BfREVQRU5ERU5DWV9UUkFDS0VSLCB0aGlzLmluamVjdGFibGVSZWdpc3RyeSxcbiAgICAgICAgISF0aGlzLmNvbXBpbGVyT3B0aW9ucy5hbm5vdGF0ZUZvckNsb3N1cmVDb21waWxlciksXG4gICAgLy8gU2VlIHRoZSBub3RlIGluIG5ndHNjIGFib3V0IHdoeSB0aGlzIGNhc3QgaXMgbmVlZGVkLlxuICAgIC8vIGNsYW5nLWZvcm1hdCBvZmZcbiAgICBuZXcgRGlyZWN0aXZlRGVjb3JhdG9ySGFuZGxlcihcbiAgICAgICAgdGhpcy5yZWZsZWN0aW9uSG9zdCwgdGhpcy5ldmFsdWF0b3IsIHRoaXMuZnVsbFJlZ2lzdHJ5LCB0aGlzLnNjb3BlUmVnaXN0cnksXG4gICAgICAgIHRoaXMuZnVsbE1ldGFSZWFkZXIsIE5PT1BfREVGQVVMVF9JTVBPUlRfUkVDT1JERVIsIHRoaXMuaW5qZWN0YWJsZVJlZ2lzdHJ5LCB0aGlzLmlzQ29yZSxcbiAgICAgICAgISF0aGlzLmNvbXBpbGVyT3B0aW9ucy5hbm5vdGF0ZUZvckNsb3N1cmVDb21waWxlcixcbiAgICAgICAgLy8gSW4gbmdjYyB3ZSB3YW50IHRvIGNvbXBpbGUgdW5kZWNvcmF0ZWQgY2xhc3NlcyB3aXRoIEFuZ3VsYXIgZmVhdHVyZXMuIEFzIG9mXG4gICAgICAgIC8vIHZlcnNpb24gMTAsIHVuZGVjb3JhdGVkIGNsYXNzZXMgdGhhdCB1c2UgQW5ndWxhciBmZWF0dXJlcyBhcmUgbm8gbG9uZ2VyIGhhbmRsZWRcbiAgICAgICAgLy8gaW4gbmd0c2MsIGJ1dCB3ZSB3YW50IHRvIGVuc3VyZSBjb21wYXRpYmlsaXR5IGluIG5nY2MgZm9yIG91dGRhdGVkIGxpYnJhcmllcyB0aGF0XG4gICAgICAgIC8vIGhhdmUgbm90IG1pZ3JhdGVkIHRvIGV4cGxpY2l0IGRlY29yYXRvcnMuIFNlZTogaHR0cHM6Ly9oYWNrbWQuaW8vQGFseC9yeWZZWXV2ekguXG4gICAgICAgIC8qIGNvbXBpbGVVbmRlY29yYXRlZENsYXNzZXNXaXRoQW5ndWxhckZlYXR1cmVzICovIHRydWVcbiAgICApIGFzIERlY29yYXRvckhhbmRsZXI8dW5rbm93biwgdW5rbm93biwgdW5rbm93bj4sXG4gICAgLy8gY2xhbmctZm9ybWF0IG9uXG4gICAgLy8gUGlwZSBoYW5kbGVyIG11c3QgYmUgYmVmb3JlIGluamVjdGFibGUgaGFuZGxlciBpbiBsaXN0IHNvIHBpcGUgZmFjdG9yaWVzIGFyZSBwcmludGVkXG4gICAgLy8gYmVmb3JlIGluamVjdGFibGUgZmFjdG9yaWVzIChzbyBpbmplY3RhYmxlIGZhY3RvcmllcyBjYW4gZGVsZWdhdGUgdG8gdGhlbSlcbiAgICBuZXcgUGlwZURlY29yYXRvckhhbmRsZXIoXG4gICAgICAgIHRoaXMucmVmbGVjdGlvbkhvc3QsIHRoaXMuZXZhbHVhdG9yLCB0aGlzLm1ldGFSZWdpc3RyeSwgdGhpcy5zY29wZVJlZ2lzdHJ5LFxuICAgICAgICBOT09QX0RFRkFVTFRfSU1QT1JUX1JFQ09SREVSLCB0aGlzLmluamVjdGFibGVSZWdpc3RyeSwgdGhpcy5pc0NvcmUpLFxuICAgIG5ldyBJbmplY3RhYmxlRGVjb3JhdG9ySGFuZGxlcihcbiAgICAgICAgdGhpcy5yZWZsZWN0aW9uSG9zdCwgTk9PUF9ERUZBVUxUX0lNUE9SVF9SRUNPUkRFUiwgdGhpcy5pc0NvcmUsXG4gICAgICAgIC8qIHN0cmljdEN0b3JEZXBzICovIGZhbHNlLCB0aGlzLmluamVjdGFibGVSZWdpc3RyeSwgLyogZXJyb3JPbkR1cGxpY2F0ZVByb3YgKi8gZmFsc2UpLFxuICAgIG5ldyBOZ01vZHVsZURlY29yYXRvckhhbmRsZXIoXG4gICAgICAgIHRoaXMucmVmbGVjdGlvbkhvc3QsIHRoaXMuZXZhbHVhdG9yLCB0aGlzLmZ1bGxNZXRhUmVhZGVyLCB0aGlzLmZ1bGxSZWdpc3RyeSxcbiAgICAgICAgdGhpcy5zY29wZVJlZ2lzdHJ5LCB0aGlzLnJlZmVyZW5jZXNSZWdpc3RyeSwgdGhpcy5pc0NvcmUsIC8qIHJvdXRlQW5hbHl6ZXIgKi8gbnVsbCxcbiAgICAgICAgdGhpcy5yZWZFbWl0dGVyLFxuICAgICAgICAvKiBmYWN0b3J5VHJhY2tlciAqLyBudWxsLCBOT09QX0RFRkFVTFRfSU1QT1JUX1JFQ09SREVSLFxuICAgICAgICAhIXRoaXMuY29tcGlsZXJPcHRpb25zLmFubm90YXRlRm9yQ2xvc3VyZUNvbXBpbGVyLCB0aGlzLmluamVjdGFibGVSZWdpc3RyeSksXG4gIF07XG4gIGNvbXBpbGVyID0gbmV3IE5nY2NUcmFpdENvbXBpbGVyKHRoaXMuaGFuZGxlcnMsIHRoaXMucmVmbGVjdGlvbkhvc3QpO1xuICBtaWdyYXRpb25zOiBNaWdyYXRpb25bXSA9IFtcbiAgICBuZXcgVW5kZWNvcmF0ZWRQYXJlbnRNaWdyYXRpb24oKSxcbiAgICBuZXcgVW5kZWNvcmF0ZWRDaGlsZE1pZ3JhdGlvbigpLFxuICAgIG5ldyBNaXNzaW5nSW5qZWN0YWJsZU1pZ3JhdGlvbigpLFxuICBdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBmczogUmVhZG9ubHlGaWxlU3lzdGVtLCBwcml2YXRlIGJ1bmRsZTogRW50cnlQb2ludEJ1bmRsZSxcbiAgICAgIHByaXZhdGUgcmVmbGVjdGlvbkhvc3Q6IE5nY2NSZWZsZWN0aW9uSG9zdCwgcHJpdmF0ZSByZWZlcmVuY2VzUmVnaXN0cnk6IFJlZmVyZW5jZXNSZWdpc3RyeSxcbiAgICAgIHByaXZhdGUgZGlhZ25vc3RpY0hhbmRsZXI6IChlcnJvcjogdHMuRGlhZ25vc3RpYykgPT4gdm9pZCA9ICgpID0+IHt9LFxuICAgICAgcHJpdmF0ZSB0c0NvbmZpZzogUGFyc2VkQ29uZmlndXJhdGlvbnxudWxsID0gbnVsbCkge31cblxuICAvKipcbiAgICogQW5hbHl6ZSBhIHByb2dyYW0gdG8gZmluZCBhbGwgdGhlIGRlY29yYXRlZCBmaWxlcyBzaG91bGQgYmUgdHJhbnNmb3JtZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIGEgbWFwIG9mIHRoZSBzb3VyY2UgZmlsZXMgdG8gdGhlIGFuYWx5c2lzIGZvciB0aG9zZSBmaWxlcy5cbiAgICovXG4gIGFuYWx5emVQcm9ncmFtKCk6IERlY29yYXRpb25BbmFseXNlcyB7XG4gICAgZm9yIChjb25zdCBzb3VyY2VGaWxlIG9mIHRoaXMucHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpKSB7XG4gICAgICBpZiAoIXNvdXJjZUZpbGUuaXNEZWNsYXJhdGlvbkZpbGUgJiZcbiAgICAgICAgICBpc1dpdGhpblBhY2thZ2UodGhpcy5wYWNrYWdlUGF0aCwgYWJzb2x1dGVGcm9tU291cmNlRmlsZShzb3VyY2VGaWxlKSkpIHtcbiAgICAgICAgdGhpcy5jb21waWxlci5hbmFseXplRmlsZShzb3VyY2VGaWxlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmFwcGx5TWlncmF0aW9ucygpO1xuXG4gICAgdGhpcy5jb21waWxlci5yZXNvbHZlKCk7XG5cbiAgICB0aGlzLnJlcG9ydERpYWdub3N0aWNzKCk7XG5cbiAgICBjb25zdCBkZWNvcmF0aW9uQW5hbHlzZXMgPSBuZXcgRGVjb3JhdGlvbkFuYWx5c2VzKCk7XG4gICAgZm9yIChjb25zdCBhbmFseXplZEZpbGUgb2YgdGhpcy5jb21waWxlci5hbmFseXplZEZpbGVzKSB7XG4gICAgICBjb25zdCBjb21waWxlZEZpbGUgPSB0aGlzLmNvbXBpbGVGaWxlKGFuYWx5emVkRmlsZSk7XG4gICAgICBkZWNvcmF0aW9uQW5hbHlzZXMuc2V0KGNvbXBpbGVkRmlsZS5zb3VyY2VGaWxlLCBjb21waWxlZEZpbGUpO1xuICAgIH1cbiAgICByZXR1cm4gZGVjb3JhdGlvbkFuYWx5c2VzO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFwcGx5TWlncmF0aW9ucygpOiB2b2lkIHtcbiAgICBjb25zdCBtaWdyYXRpb25Ib3N0ID0gbmV3IERlZmF1bHRNaWdyYXRpb25Ib3N0KFxuICAgICAgICB0aGlzLnJlZmxlY3Rpb25Ib3N0LCB0aGlzLmZ1bGxNZXRhUmVhZGVyLCB0aGlzLmV2YWx1YXRvciwgdGhpcy5jb21waWxlcixcbiAgICAgICAgdGhpcy5idW5kbGUuZW50cnlQb2ludC5wYXRoKTtcblxuICAgIHRoaXMubWlncmF0aW9ucy5mb3JFYWNoKG1pZ3JhdGlvbiA9PiB7XG4gICAgICB0aGlzLmNvbXBpbGVyLmFuYWx5emVkRmlsZXMuZm9yRWFjaChhbmFseXplZEZpbGUgPT4ge1xuICAgICAgICBjb25zdCByZWNvcmRzID0gdGhpcy5jb21waWxlci5yZWNvcmRzRm9yKGFuYWx5emVkRmlsZSk7XG4gICAgICAgIGlmIChyZWNvcmRzID09PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBc3NlcnRpb24gZXJyb3I6IGZpbGUgdG8gbWlncmF0ZSBtdXN0IGhhdmUgcmVjb3Jkcy4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlY29yZHMuZm9yRWFjaChyZWNvcmQgPT4ge1xuICAgICAgICAgIGNvbnN0IGFkZERpYWdub3N0aWMgPSAoZGlhZ25vc3RpYzogdHMuRGlhZ25vc3RpYykgPT4ge1xuICAgICAgICAgICAgaWYgKHJlY29yZC5tZXRhRGlhZ25vc3RpY3MgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgcmVjb3JkLm1ldGFEaWFnbm9zdGljcyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVjb3JkLm1ldGFEaWFnbm9zdGljcy5wdXNoKGRpYWdub3N0aWMpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gbWlncmF0aW9uLmFwcGx5KHJlY29yZC5ub2RlLCBtaWdyYXRpb25Ib3N0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgYWRkRGlhZ25vc3RpYyhyZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChpc0ZhdGFsRGlhZ25vc3RpY0Vycm9yKGUpKSB7XG4gICAgICAgICAgICAgIGFkZERpYWdub3N0aWMoZS50b0RpYWdub3N0aWMoKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCByZXBvcnREaWFnbm9zdGljcygpIHtcbiAgICB0aGlzLmNvbXBpbGVyLmRpYWdub3N0aWNzLmZvckVhY2godGhpcy5kaWFnbm9zdGljSGFuZGxlcik7XG4gIH1cblxuICBwcm90ZWN0ZWQgY29tcGlsZUZpbGUoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IENvbXBpbGVkRmlsZSB7XG4gICAgY29uc3QgY29uc3RhbnRQb29sID0gbmV3IENvbnN0YW50UG9vbCgpO1xuICAgIGNvbnN0IHJlY29yZHMgPSB0aGlzLmNvbXBpbGVyLnJlY29yZHNGb3Ioc291cmNlRmlsZSk7XG4gICAgaWYgKHJlY29yZHMgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQXNzZXJ0aW9uIGVycm9yOiBmaWxlIHRvIGNvbXBpbGUgbXVzdCBoYXZlIHJlY29yZHMuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcGlsZWRDbGFzc2VzOiBDb21waWxlZENsYXNzW10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgcmVjb3JkIG9mIHJlY29yZHMpIHtcbiAgICAgIGNvbnN0IGNvbXBpbGF0aW9uID0gdGhpcy5jb21waWxlci5jb21waWxlKHJlY29yZC5ub2RlLCBjb25zdGFudFBvb2wpO1xuICAgICAgaWYgKGNvbXBpbGF0aW9uID09PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb21waWxlZENsYXNzZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHJlY29yZC5ub2RlLm5hbWUudGV4dCxcbiAgICAgICAgZGVjb3JhdG9yczogdGhpcy5jb21waWxlci5nZXRBbGxEZWNvcmF0b3JzKHJlY29yZC5ub2RlKSxcbiAgICAgICAgZGVjbGFyYXRpb246IHJlY29yZC5ub2RlLFxuICAgICAgICBjb21waWxhdGlvblxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVleHBvcnRzID0gdGhpcy5nZXRSZWV4cG9ydHNGb3JTb3VyY2VGaWxlKHNvdXJjZUZpbGUpO1xuICAgIHJldHVybiB7Y29uc3RhbnRQb29sLCBzb3VyY2VGaWxlOiBzb3VyY2VGaWxlLCBjb21waWxlZENsYXNzZXMsIHJlZXhwb3J0c307XG4gIH1cblxuICBwcml2YXRlIGdldFJlZXhwb3J0c0ZvclNvdXJjZUZpbGUoc2Y6IHRzLlNvdXJjZUZpbGUpOiBSZWV4cG9ydFtdIHtcbiAgICBjb25zdCBleHBvcnRTdGF0ZW1lbnRzID0gdGhpcy5jb21waWxlci5leHBvcnRTdGF0ZW1lbnRzO1xuICAgIGlmICghZXhwb3J0U3RhdGVtZW50cy5oYXMoc2YuZmlsZU5hbWUpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGNvbnN0IGV4cG9ydHMgPSBleHBvcnRTdGF0ZW1lbnRzLmdldChzZi5maWxlTmFtZSkhO1xuXG4gICAgY29uc3QgcmVleHBvcnRzOiBSZWV4cG9ydFtdID0gW107XG4gICAgZXhwb3J0cy5mb3JFYWNoKChbZnJvbU1vZHVsZSwgc3ltYm9sTmFtZV0sIGFzQWxpYXMpID0+IHtcbiAgICAgIHJlZXhwb3J0cy5wdXNoKHthc0FsaWFzLCBmcm9tTW9kdWxlLCBzeW1ib2xOYW1lfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlZXhwb3J0cztcbiAgfVxufVxuIl19