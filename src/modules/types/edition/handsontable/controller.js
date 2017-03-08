'use strict';

define(['jquery', 'modules/default/defaultcontroller'], function ($, Default) {

    function Controller() {
    }

    $.extend(true, Controller.prototype, Default);

    Controller.prototype.moduleInformation = {
        name: 'Handson Table',
        description: 'Excel-like table',
        author: 'Daniel Kostro',
        date: '08.03.2017',
        license: 'MIT',
        cssClass: 'handson'
    };

    Controller.prototype.references = {
        table: {
            label: 'Table (array) to display'
        }
    };

    Controller.prototype.events = {
        // onChanged: {
        //     label: 'Table changed',
        //     refVariable: ['renderedHtml'],
        //     refAction: ['renderedHtml']
        // }
    };

    Controller.prototype.variablesIn = ['table'];

    Controller.prototype.configurationStructure = function () {
        return {
            groups: {
                group: {
                    options: {
                        type: 'list'
                    },
                    fields: {
                        template: {
                            type: 'jscode',
                            title: 'Template',
                            mode: 'html',
                            'default': ''
                        }
                    }
                }
            }
        };
    };

    Controller.prototype.configAliases = {
        template: ['groups', 'group', 0, 'template', 0]
    };


    return Controller;
});
