"use strict"

angular.module("webapp", [
  "appTemplates", "ui.router"
])
  .config ($stateProvider, $urlRouterProvider, $httpProvider) ->

    $urlRouterProvider.otherwise("/");

    $stateProvider
      .state 'home',
        url: "/",
        templateUrl: "templates/home.tpl.html"
        controller: "HomeController"

    $httpProvider.defaults.headers.common = { "Content-Type" : "application/json" }