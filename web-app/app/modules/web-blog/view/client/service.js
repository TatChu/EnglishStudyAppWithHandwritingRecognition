(function() {
    'use strict';

    angular
        .module('bzWebBlog')
        .service('blogWebSvc', blogWebSvc)
        .factory('blogWebFac', blogWebFac);

    function blogWebFac($window, customResourceSrv) {
        return customResourceSrv.api($window.settings.services.webUrl + '/:method/:id', { method: '@method', id: '@id' });
    }

    function blogWebSvc($q, $window, customResourceSrv, blogWebFac) {
        return {
            getAll: getAll,
            getAllTag: getAllTag,
        };

        function getAll(options){
            var getFac = new blogWebFac(options);
            return getFac.$get({method: 'blogs'});
        }

        function getAllTag(options){
            var getFac = new blogWebFac(options);
            return getFac.$get({method: 'tags-blog'});
        }
    }
})();