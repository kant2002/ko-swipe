/// <reference path="typings/tsd.d.ts" />

import ko = require('knockout');
import Swipe = require('swipe');

interface SwipeBindingOptions {
    index: KnockoutObservable<number>;
    duration?: number;
    slideWidth?: number;
    autoFix?: boolean;
    breakDistance?: number;
}
interface SwipeKnockoutBindingContext extends KnockoutBindingContext {
    $swiper: Swipe;
    $swiperIndex?: number;
    insideUpdate: boolean;
    insideCallback: boolean;
    firstTime: boolean;
}
var swipeHandler = {
    insideUpdate: false,
    insideCallback: false,
    firstTime: true,
    logging: false,
    defaultDuration: 400,
    log: function (message, ...params) {
        if (swipeHandler.logging) {
            console.log(message, params);
        }
    },
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
        viewModel: any, bindingContext: SwipeKnockoutBindingContext) {
        var valObservable: SwipeBindingOptions = valueAccessor();
        var autoFix = valObservable.autoFix === undefined ? true : !!valObservable.autoFix;
        var breakDistance = valObservable.breakDistance === undefined ? null : valObservable.breakDistance;
        bindingContext.firstTime = true;
        bindingContext.insideUpdate = false;
        bindingContext.insideCallback = false;
        element.onscroll = function () {
            element.scrollLeft = 0;
        };
        bindingContext.$swiper = new Swipe(element, {
            startSlide: valObservable.index() - 1,
            speed: valObservable.duration || swipeHandler.defaultDuration,
            slideWidth: ko.unwrap(valObservable.slideWidth || 0),
            continuous: true,
            disableScroll: false,
            stopPropagation: false,
            breakDistance: breakDistance,
            callback: function (index, elem) {
                swipeHandler.log("Callback: index - ", index, ", value - ", valObservable.index());
                if (bindingContext.insideUpdate) {
                    swipeHandler.log("swipeHandler.insideUpdate = false");
                    bindingContext.insideUpdate = false;
                    return;
                }

                bindingContext.insideCallback = true;
                swipeHandler.log("swipeHandler.insideCallback = true");
                valObservable.index(index + 1);
                setTimeout(function () {
                    bindingContext.insideCallback = false;
                }, 100);
            }
        });
    },
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
        viewModel: any, bindingContext: SwipeKnockoutBindingContext) {
        var valObservable: SwipeBindingOptions = valueAccessor();
        swipeHandler.log("Update: value - ", valObservable.index());
        bindingContext.$swiperIndex = valObservable.index();
        if (bindingContext.firstTime) {
            bindingContext.firstTime = false;
            return;
        }

        if (bindingContext.insideCallback) {
            swipeHandler.log("swipeHandler.insideCallback = false");
            swipeHandler.insideCallback = false;
            return;
        }

        var swiper = bindingContext.$swiper;
        swipeHandler.log("swipeHandler.insideUpdate = true");
        bindingContext.insideUpdate = true;
        swiper.slide(valObservable.index() - 1, valObservable.duration || swipeHandler.defaultDuration);
    }
};
ko.bindingHandlers["swipe"] = swipeHandler;
ko.bindingHandlers["swipeForeach"] = {
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
        viewModel: any, bindingContext: SwipeKnockoutBindingContext) {
        swipeHandler.log("swipeForeach init ", ko.unwrap(valueAccessor()), viewModel, bindingContext.$swiper);
        ko.bindingHandlers.foreach.init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        return { controlsDescendantBindings: true };
    },
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
        viewModel: any, bindingContext: SwipeKnockoutBindingContext) {
        swipeHandler.log("swipeForeach update ", ko.unwrap(valueAccessor()), viewModel, bindingContext.$swiper);
        ko.bindingHandlers.foreach.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        swipeHandler.log("Preious slider position ", bindingContext.$swiperIndex);
        bindingContext.$swiper.kill();
        bindingContext.$swiper.setup();
        bindingContext.$swiper.attachEvents();
        bindingContext.$swiper.slide(bindingContext.$swiperIndex - 1, 0);
    }
};
ko.virtualElements.allowedBindings["swipeForeach"] = true;
