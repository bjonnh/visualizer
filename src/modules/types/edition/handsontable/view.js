'use strict';

define([
    'modules/default/defaultview',
    'src/util/util',
    'formulajs',
    'ruleJS',
    'jquery'
], function (Default, Util, formulajs) {

    // Unfortunately ruleJS requires Formula to be global
    window.Formula = formulajs;
    function View() {
    }

    Util.loadCss('components/handsontable/dist/handsontable.full.min.css');
    Util.loadCss('components/handsontable-ruleJS/src/handsontable.formula.css');

    $.extend(true, View.prototype, Default, {
        init() {
           this.dom = $('<div>');
           this.dom.css({
               width: '100%'
           })

        },


        blank: {
            table() {
            }
        },

        inDom() {
            this.module.getDomContent().html(this.dom);

            var data1 = [
                ['=$B$2', "Maserati", "Mazda", "Mercedes", "Mini", "=A$1"],
                [2009, 0, 2941, 4303, 354, 5814],
                [2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1'],
                [2011, 4, 2517, 4822, 552, 6127],
                [2012, '=SUM(A2:A5)', '=SUM(B5,E3)', '=A2/B2', 12, 4151]
            ];

            this.dom.handsontable({
                data: data1,
                minSpareRows: 1,
                colHeaders: true,
                rowHeaders: true,
                contextMenu: true,
                manualColumnResize: true,
                formulas: true
            });


            this.resolveReady();
        },

        update: {
            table: function (value) {
            }
        }
    });

    return View;

});
