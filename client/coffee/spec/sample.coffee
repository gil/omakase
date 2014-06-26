describe "something", () ->

  HomeController = null;

  beforeEach( module('myApp') )

  beforeEach inject ($injector, _$rootScope_) ->
    $controller = $injector.get('$controller')
    $rootScope = _$rootScope_
    $scope = $rootScope.$new()

    HomeController = $controller 'HomeController',
      '$rootScope': $rootScope
      '$scope': $scope

  it "should do something", () ->
    expect(HomeController).not.toBe null