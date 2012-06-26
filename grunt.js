/*jshint node:true */
module.exports = function( grunt ) {

var // files
	pageFiles = grunt.file.expandFiles( "pages/*.html" ),
	entryFiles = grunt.file.expandFiles( "entries/*.xml" ),
	noteFiles = grunt.file.expandFiles( "notes/*.xml" ),
  path = require( "path" ),
  rimraf = require( "rimraf" ),
	xmlFiles = [].concat( entryFiles, noteFiles, "cat2tax.xsl", "categories.xml", "entries2html.xsl", "xml2json.xsl" );

grunt.loadNpmTasks( "grunt-clean" );
grunt.loadNpmTasks( "grunt-wordpress" );
grunt.loadNpmTasks( "grunt-jquery-content" );

grunt.initConfig({
	clean: {
		folder: "dist"
	},
	lint: {
		grunt: "grunt.js"
	},
	xmllint: {
		all: xmlFiles
	},
	xmltidy: {
		all: [].concat( entryFiles, noteFiles, "categories.xml" )
	},
	"build-pages": {
		all: grunt.file.expandFiles( "pages/*" )
	},
	"build-xml-entries": {
		all: entryFiles
	},
	"build-resources": {
		all: grunt.file.expandFiles( "resources/*" )
	},
	wordpress: grunt.utils._.extend({
		dir: "dist/wordpress"
	}, grunt.file.readJSON( "config.json" ) )
});


grunt.registerMultiTask( "build-pages", "Process html files as pages", function() {
	var task = this,
		taskDone = task.async(),
		files = this.data,
		targetDir = grunt.config( "wordpress.dir" ) + "/posts/page/";

	grunt.file.mkdir( targetDir );

	grunt.utils.async.forEachSeries( files, function( fileName, fileDone ) {
		var targetFileName = targetDir + fileName.replace( /^.+?\//, "" );

		grunt.verbose.write( "Processing " + fileName + "..." );
		grunt.file.copy( fileName, targetFileName );
    fileDone();

	}, function() {
		if ( task.errorCount ) {
			grunt.warn( "Task \"" + task.name + "\" failed." );
			taskDone();
			return;
		}
		grunt.log.writeln( "Built " + files.length + " pages." );
		taskDone();
	});
});

grunt.registerMultiTask( "build-xml-entries", "Process API xml files with xsl", function() {
	var task = this,
		taskDone = task.async(),
		files = this.data,
		// TODO make `entry` a custom post type instead of (ab)using `post`?
		targetDir = grunt.config( "wordpress.dir" ) + "/posts/post/";

	grunt.file.mkdir( targetDir );

	grunt.utils.async.forEachSeries( files, function( fileName, fileDone ) {
		grunt.verbose.write( "Transforming (pass 1: preproc-xinclude.xsl) " + fileName + "..." );
		grunt.utils.spawn({
			cmd: "xsltproc",
			args: [ "preproc-xinclude.xsl", fileName ]
		}, function( err, pass1result ) {
			if ( err ) {
				grunt.verbose.error();
				grunt.log.error( err );
				fileDone();
				return;
			}
			grunt.verbose.ok();

			var targetXMLFileName = "entries_tmp/" + path.basename( fileName );

			grunt.file.write( targetXMLFileName, pass1result );

			grunt.verbose.write( "Transforming (pass 2: entries2html.xsl) " + fileName + "..." );
			grunt.utils.spawn({
				cmd: "xsltproc",
				args: [ "--xinclude", "entries2html.xsl", targetXMLFileName ]
			}, function( err, pass2result ) {
				if ( err ) {
					grunt.verbose.error();
					grunt.log.error( err );
					fileDone();
					return;
				}
				grunt.verbose.ok();

				var targetHTMLFileName = targetDir + path.basename( fileName );
				targetHTMLFileName = targetHTMLFileName.substr( 0, targetHTMLFileName.length - "xml".length ) + "html";
        grunt.file.write( targetHTMLFileName, pass2result );
        fileDone();
			});
		});
	}, function() {
		if ( task.errorCount ) {
			grunt.warn( "Task \"" + task.name + "\" failed." );
			taskDone();
			return;
		}
		rimraf.sync( "entries_tmp" );
		grunt.log.writeln( "Built " + files.length + " entries." );
		taskDone();
	});
});

grunt.registerTask( "default", "build-wordpress" );
grunt.registerTask( "build-wordpress", "clean lint xmllint build-pages build-xml-entries build-xml-categories build-resources" );
grunt.registerTask( "tidy", "xmllint xmltidy" );

};
