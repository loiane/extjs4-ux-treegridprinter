Ext.define("Ext.ux.tree.Printer", {
    
    requires: 'Ext.XTemplate',

    statics: {

        /**
       * Prints the component
       * @param {Ext.Component} component The component to print
       */
      print: function(component) {
        var name = "print";
                 
        var win = window.open('', name);
        
        // gecko looses its document after document.close(). but fortunally waits with printing till css is loaded itself
        if (Ext.isGecko) {
          win.print();
          win.close();
          return;
        }
        
        win.document.write(this.generateHTML(component));
        win.document.close();

        //doPrintOnStylesheetLoad.defer(10, this, [win]);
      },

      /**
       * check if style is loaded and do print afterwards
       * 
       * @param {window} win
       */
      doPrintOnStylesheetLoad: function(win) {
        var el = win.document.getElementById('csscheck'),
            comp = el.currentStyle || getComputedStyle(el, null);
        if (comp.display !== "none") {
          this.doPrintOnStylesheetLoad.defer(10, this, [win]);
          return;
        }
        win.print();
        win.close();
      },

      /**
       * Generates the HTML Markup which wraps whatever this.generateBody produces
       * @param {Ext.Component} component The component to generate HTML for
       * @return {String} An HTML fragment to be placed inside the print window
       */
      generateHTML: function(component) {
        return new Ext.XTemplate(
          '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
          '<html class="' + Ext.baseCSSPrefix + 'ux-grid-printer">',
            '<head>',
              '<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />',
              '<link href="' + this.stylesheetPath + '?' + new Date().getTime() + '" rel="stylesheet" type="text/css" media="screen,print" />',
              '<title>' + this.getTitle(component) + '</title>',
            '</head>',
            '<body class="' + Ext.baseCSSPrefix + 'ux-grid-printer-body">',
                '<div class="' + Ext.baseCSSPrefix + 'ux-grid-printer-noprint ' + Ext.baseCSSPrefix + 'ux-grid-printer-links">',
                    '<a class="' + Ext.baseCSSPrefix + 'ux-grid-printer-linkprint" href="javascript:void(0);" onclick="window.print();">' + this.printLinkText + '</a>',
                    '<a class="' + Ext.baseCSSPrefix + 'ux-grid-printer-linkclose" href="javascript:void(0);" onclick="window.close();">' + this.closeLinkText + '</a>',
                '</div>',
                '<h1>' + this.getTitle(component) + '</h1>',
              '<div id="csscheck"></div>',
              this.generateBody(component),
            '</body>',
          '</html>'
        ).apply(this.prepareData(component));
      },

      /**
       * Returns the title to give to the print window
       * @param {Ext.Component} component The component to be printed
       * @return {String} The window title
       */
      getTitle: function(component) {
        return typeof component.getTitle == 'function' ? component.getTitle() : (component.title || "Printing");
      },

        /**
         * Descends down the tree from the root, creating an array of data suitable for use in an XTemplate
         * @param {Ext.tree.ColumnTree} tree The column tree
         * @return {Array} Data suitable for use in the body XTemplate
         */
        prepareData: function(tree) {
          var root = tree.getRootNode(),
              data = [],
              cols = this.getColumns(tree),
              padding = this.indentPadding;
              
          var f = function(node) {
              if (node.isFirst === true && !tree.rootVisible) {
                return;
              }

              var row = Ext.apply({depth: node.getDepth() * padding}, node.attributes);
              
              Ext.iterate(row, function(key, value) {
                Ext.each(cols, function(column) {
                  if (column.dataIndex == key) {
                    row[key] = column.renderer ? column.renderer(value) : value;
                  }
                }, this);        
              });
          
            for (i=0; i<cols.length; i++){
              row[this.getColumns(tree)[i].dataIndex] = node.get(this.getColumns(tree)[i].dataIndex);
            }
            
            data.push(row);
          };
    
          root.cascadeBy(f, this);
          
          return data;
        },


        /**
         * Generates the body HTML for the tree
         * @param {Ext.tree.ColumnTree} tree The tree to print
         */
        generateBody: function(tree) {
          var columns = this.getColumns(tree);
          
          //use the headerTpl and bodyTpl XTemplates to create the main XTemplate below
          var headings = Ext.create('Ext.XTemplate', this.headerTpl).apply(columns);
          var body     = Ext.create('Ext.XTemplate', this.bodyTpl).apply(columns);
          
          return Ext.String.format('<table>{0}<tpl for=".">{1}</tpl></table>', headings, body);
        },
          
        /**
         * Returns the array of columns from a tree
         * @param {Ext.tree.ColumnTree} tree The tree to get columns from
         * @return {Array} The array of tree columns
         */
        getColumns: function(tree) {
          return tree.columns;
        },

        /**
         * @property stylesheetPath
         * @type String
         * The path at which the print stylesheet can be found (defaults to 'ux/grid/gridPrinterCss/print.css')
         */
        stylesheetPath: '../ux/tree/css/print.css',
        
        /**
         * @property printAutomatically
         * @type Boolean
         * True to open the print dialog automatically and close the window after printing. False to simply open the print version
         * of the grid (defaults to false)
         */
        printAutomatically: false,
        
        /**
         * @property closeAutomaticallyAfterPrint
         * @type Boolean
         * True to close the window automatically after printing.
         * (defaults to false)
         */
        closeAutomaticallyAfterPrint: false,        
        
        /**
         * @property mainTitle
         * @type String
         * Title to be used on top of the table
         * (defaults to empty)
         */
        mainTitle: '',
        
        /**
         * @property defaultGridTitle
         * @type String
         * Title to be used if grid to be printed
         * has no title attribute set.
         */
        defaultGridTitle: 'Print View',
        
        /**
         * Text show on print link
         * @type String
         */
        printLinkText: 'Print',
        
        /**
         * Text show on close link
         * @type String
         */
        closeLinkText: 'Close',

        /**
         * @property indentPadding
         * @type Number
         * Number of pixels to indent node by. This is multiplied by the node depth, so a node with node.getDepth() == 3 will
         * be padded by 45 (or 3x your custom indentPadding)
         */
        indentPadding: 15,
        
        /**
         * @property headerTpl
         * @type {Object/Array} values
         * The markup used to create the headings row. By default this just uses <th> elements, override to provide your own
         */
        headerTpl: [ 
            '<tr>',
              '<tpl for=".">',
                '<th width="{width}">{text}</th>',
              '</tpl>',
            '</tr>'
        ],

        /**
         * @property bodyTpl
         * @type {Object/Array} values
         * The XTemplate used to create each row. This is used inside the 'print' function to build another XTemplate, to which the data
         * are then applied (see the escaped dataIndex attribute here - this ends up as "{dataIndex}")
         */
        bodyTpl: [
            '<tr>',
              '<tpl for=".">',
                '<td style="padding-left: {[xindex == 1 ? "\\{depth\\}" : "0"]}px">\{{dataIndex}\}</td>',
              '</tpl>',
            '</tr>'
        ]
    }
});
