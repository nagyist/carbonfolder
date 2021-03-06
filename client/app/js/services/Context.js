
/* global angular */

/**
 * @doc module
 * @id Factories
 * @description Factories
 *
 * @author Alexandre Strzelewicz <as@unitech.io>
 */

var Services = angular.module('Services', []);

Services.constant('version', '0.1');

/**
 * @doc service
 * @id MCtrl:Context
 * 
 * @description 
 * @author Alexandre Strzelewicz <as@unitech.io>
 */
Services.factory('Context', ['Dropbox', 'localStorageService', function(Dropbox, localStorageService) {
  var Context = {
    projects        : [],
    types           : [],
    bulk_contents   : [],
    bulk_medias     : [],    
    current_project : null,
    current_content : null,
    current_type    : null,
    current_media   : null
  };
  
  // Refresh projects
  Context.refreshProjects = function(cb) {       
    Dropbox.getProjects(function(err, dt) {
      if (err) return alert(err);

      Context.projects         = dt;
      Context.current_project  = dt[0];
      return cb(null);
    });
  };

  Context.cleanContext = function() {
    Context.types         = {};
    Context.bulk_contents = [];
    Context.bulk_medias   = [];
    Context.current_content = null;
    Context.current_type    = null;
    Context.current_media   = null;
  };

  Context.cacheReset = function() {
    localStorageService.clearAll();
  };
  
  Context.addLocalType = function(new_type) {
    Context.types[new_type.name] = new_type;
  };
  
  // Refresh one project
  // Deeprefresh force refreshing without caching
  Context.refreshProjectContext  = function(project_name, deep_refresh, cb) {
    if (typeof cb === 'undefined') {
      cb = deep_refresh;
      deep_refresh = false;
    }
    
    var localProject = JSON.parse(localStorageService.get(project_name));
    
    if (!localProject || deep_refresh) {
      Orion.emit('loading', 'Remote refreshing ' + project_name + ' project context');
      Dropbox.getAllContents(project_name, function(err, dt, bulk_contents) {
        if (err) return alert(err);

        Dropbox.fetchMedia(project_name, function(mediaFiles) {

        //Context.cleanContext();
        
          Context.current_project = project_name;    
          Context.types           = dt;
          Context.bulk_contents   = bulk_contents;
          Context.bulk_medias     = mediaFiles;
          
          localStorageService.set(project_name, JSON.stringify({
            types : dt,
            bulk_contents : bulk_contents,
            bulk_medias   : mediaFiles
          }));

          Orion.emit('end', 'Data set in localstorage for ' + project_name);
          
          return cb(err);

        });
      });
    }
    else {
      Orion.emit('end', 'Data retrieved from localstorage for ' + project_name);      
      Context.current_project = project_name;    
      Context.types           = localProject.types;
      Context.bulk_contents   = localProject.bulk_contents;
      Context.bulk_medias     = localProject.bulk_medias;
    }
  };
  
  return Context;
}]);
