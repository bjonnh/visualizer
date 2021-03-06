'use strict';

define(['modules/default/defaultcontroller', 'openchemlib/openchemlib-full', 'src/util/ui'], function (Default, OCL, ui) {
  function Controller() {
    this.currentMol = {
      idcode: '',
      coordinates: ''
    };
  }

  $.extend(true, Controller.prototype, Default);

  Controller.prototype.getToolbar = function () {
    var base = Default.getToolbar.call(this);
    base.unshift({
      onClick: function () {
        var w = $(window).width();
        var h = $(window).height();
        var url = require.toUrl('modules/types/science/chemistry/ocl_editor/help/index.html');
        ui.dialog(`<iframe src=${url} width="100%", height="100%" frameBorder="0"></iframe>`, {
          width: Math.min(w - 40, 800),
          height: h - 70,
          title: 'OpenChemLib editor Help'
        });
      },
      title: 'Help',
      cssClass: 'fa fa-question',
      ifLocked: true
    });
    return base;
  };

  Controller.prototype.moduleInformation = {
    name: 'OCL Molecule editor',
    description: 'Molecule editor using the openchemlib javascript library',
    author: 'Michael Zasso',
    date: '11.05.2015',
    license: 'BSD',
    cssClass: 'ocl_editor'
  };

  Controller.prototype.references = {
    mol: {
      label: 'Molfile 2D'
    },
    molV3: {
      label: 'Molfile V3 2D'
    },
    smiles: {
      label: 'Smiles'
    },
    actid: {
      label: 'OCL molecule ID'
    },
    actidOrGroup: {
      label: 'OCL molecule ID. Distinguish racemic OR group.'
    }
  };

  Controller.prototype.variablesIn = ['mol', 'smiles', 'actid'];

  Controller.prototype.events = {
    onStructureChange: {
      label: 'Molecular structure has changed',
      refVariable: ['mol', 'molV3', 'smiles', 'actid', 'actidOrGroup']
    }
  };

  Controller.prototype.configurationStructure = function () {
    return {
      groups: {
        group: {
          options: {
            type: 'list'
          },
          fields: {
            prefs: {
              type: 'checkbox',
              title: 'Options',
              default: ['svg'],
              options: {
                queryFeatures: 'Enable query features',
                svg: 'Use SVG toolbar'
                // inPlace: 'In-place modification of input'
              }
            }
          }
        }
      }
    };
  };

  Controller.prototype.configAliases = {
    prefs: ['groups', 'group', 0, 'prefs', 0]
  };

  Controller.prototype.onChange = function (idCode, molecule) {
    var split = (idCode || ' ').split(' ');

    var idCodeOr = molecule.getCanonizedIDCode(OCL.Molecule.CANONIZER_DISTINGUISH_RACEMIC_OR_GROUPS);
    var idCode = split[0];
    var coordinates = split[1];
    if (idCodeOr !== this.currentMol.idCodeOr || coordinates !== this.currentMol.coordinates) {
      this.currentMol = {
        coordinates,
        idCode,
        idCodeOr
      };
      var molfile = molecule.toMolfile();
      var molfileV3 = molecule.toMolfileV3();
      var smiles = molecule.toSmiles();
      this.createDataFromEvent('onStructureChange', 'mol', molfile);
      this.createDataFromEvent('onStructureChange', 'molV3', molfileV3);
      this.createDataFromEvent('onStructureChange', 'smiles', smiles);
      this.createDataFromEvent('onStructureChange', 'actid', {
        value: split[0],
        coordinates: split[1]
      });
      this.createDataFromEvent('onStructureChange', 'actidOrGroup', {
        value: idCodeOr,
        coordinates: coordinates
      });
            

      // inplace modification is disabled for now because of unexpected change events
      /* if (this.module.getConfigurationCheckbox('prefs', 'inPlace') &&
                this.module.view._currentType) {
                var currentValue = this.module.view._currentValue;
                switch (this.module.view._currentType) {
                    case 'mol':
                        currentValue.setValue(molfile);
                        break;
                    case 'smiles':
                        currentValue.setValue(smiles);
                        break;
                    case 'oclid':
                        if (currentValue.value) {
                            currentValue.coordinates = split[1];
                        }
                        currentValue.setValue(split[0]);
                        break;
                }
                this.module.model.dataTriggerChange(currentValue);
            }*/
    }
  };

  return Controller;
});
