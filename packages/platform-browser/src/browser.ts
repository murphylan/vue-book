/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CommonModule, PlatformLocation, ɵPLATFORM_BROWSER_ID as PLATFORM_BROWSER_ID} from '@angular/common';
import {APP_ID, ApplicationModule, ClassProvider, ConstructorSansProvider, ErrorHandler, ExistingProvider, FactoryProvider, Inject, InjectionToken, ModuleWithProviders, NgModule, NgZone, Optional, PLATFORM_ID, PLATFORM_INITIALIZER, PlatformRef, RendererFactory2, RootRenderer, Sanitizer, SkipSelf, StaticProvider, Testability, TypeProvider, ValueProvider, createPlatformFactory, platformCore, ɵAPP_ROOT as APP_ROOT, ɵConsole as Console} from '@angular/core';

import {BrowserDomAdapter} from './browser/browser_adapter';
import {BrowserPlatformLocation} from './browser/location/browser_platform_location';
import {Meta} from './browser/meta';
import {SERVER_TRANSITION_PROVIDERS, TRANSITION_ID} from './browser/server-transition';
import {BrowserGetTestability} from './browser/testability';
import {Title} from './browser/title';
import {ELEMENT_PROBE_PROVIDERS} from './dom/debug/ng_probe';
import {getDOM} from './dom/dom_adapter';
import {DomRendererFactory2} from './dom/dom_renderer';
import {DOCUMENT} from './dom/dom_tokens';
import {DomEventsPlugin} from './dom/events/dom_events';
import {EVENT_MANAGER_PLUGINS, EventManager, EventManagerPlugin} from './dom/events/event_manager';
import {HAMMER_GESTURE_CONFIG, HAMMER_LOADER, HammerGestureConfig, HammerGesturesPlugin} from './dom/events/hammer_gestures';
import {KeyEventsPlugin} from './dom/events/key_events';
import {DomSharedStylesHost, SharedStylesHost} from './dom/shared_styles_host';
import {DomSanitizer, DomSanitizerImpl} from './security/dom_sanitization_service';

export const INTERNAL_BROWSER_PLATFORM_PROVIDERS: StaticProvider[] = [
  {provide: PLATFORM_ID, useValue: PLATFORM_BROWSER_ID},
  {provide: PLATFORM_INITIALIZER, useValue: initDomAdapter, multi: true},
  {provide: PlatformLocation, useClass: BrowserPlatformLocation, deps: [DOCUMENT]},
  {provide: DOCUMENT, useFactory: _document, deps: []},
];

/**
 * @security Replacing built-in sanitization providers exposes the application to XSS risks.
 * Attacker-controlled data introduced by an unsanitized provider could expose your
 * application to XSS risks. For more detail, see the [Security Guide](http://g.co/ng/security).
 *
 * 替换内置的净化（sanitization）提供商以消除应用的 XSS 风险。
 * 攻击者所控制的数据如果没经过净化就直接引入，则会让你的应用暴露于 XSS 风险之下。
 * 欲知详情，参见[安全](http://g.co/ng/security)。
 *
 * @experimental
 */
export const BROWSER_SANITIZATION_PROVIDERS: StaticProvider[] = [
  {provide: Sanitizer, useExisting: DomSanitizer},
  {provide: DomSanitizer, useClass: DomSanitizerImpl, deps: [DOCUMENT]},
];

export const platformBrowser: (extraProviders?: StaticProvider[]) => PlatformRef =
    createPlatformFactory(platformCore, 'browser', INTERNAL_BROWSER_PLATFORM_PROVIDERS);

export function initDomAdapter() {
  BrowserDomAdapter.makeCurrent();
  BrowserGetTestability.init();
}

export function errorHandler(): ErrorHandler {
  return new ErrorHandler();
}

export function _document(): any {
  return document;
}

export const BROWSER_MODULE_PROVIDERS: StaticProvider[] = [
  BROWSER_SANITIZATION_PROVIDERS,
  {provide: APP_ROOT, useValue: true},
  {provide: ErrorHandler, useFactory: errorHandler, deps: []},
  {
    provide: EVENT_MANAGER_PLUGINS,
    useClass: DomEventsPlugin,
    multi: true,
    deps: [DOCUMENT, NgZone, PLATFORM_ID]
  },
  {provide: EVENT_MANAGER_PLUGINS, useClass: KeyEventsPlugin, multi: true, deps: [DOCUMENT]},
  {
    provide: EVENT_MANAGER_PLUGINS,
    useClass: HammerGesturesPlugin,
    multi: true,
    deps: [DOCUMENT, HAMMER_GESTURE_CONFIG, Console, [new Optional(), HAMMER_LOADER]]
  },
  {provide: HAMMER_GESTURE_CONFIG, useClass: HammerGestureConfig, deps: []},
  {
    provide: DomRendererFactory2,
    useClass: DomRendererFactory2,
    deps: [EventManager, DomSharedStylesHost]
  },
  {provide: RendererFactory2, useExisting: DomRendererFactory2},
  {provide: SharedStylesHost, useExisting: DomSharedStylesHost},
  {provide: DomSharedStylesHost, useClass: DomSharedStylesHost, deps: [DOCUMENT]},
  {provide: Testability, useClass: Testability, deps: [NgZone]},
  {provide: EventManager, useClass: EventManager, deps: [EVENT_MANAGER_PLUGINS, NgZone]},
  ELEMENT_PROBE_PROVIDERS,
];

/**
 * The ng module for the browser.
 *
 * 供浏览器使用的 NgModule。
 *
 */
@NgModule({providers: BROWSER_MODULE_PROVIDERS, exports: [CommonModule, ApplicationModule]})
export class BrowserModule {
  constructor(@Optional() @SkipSelf() @Inject(BrowserModule) parentModule: BrowserModule|null) {
    if (parentModule) {
      throw new Error(
          `BrowserModule has already been loaded. If you need access to common directives such as NgIf and NgFor from a lazy loaded module, import CommonModule instead.`);
    }
  }

  /**
   * Configures a browser-based application to transition from a server-rendered app, if
   * one is present on the page. The specified parameters must include an application id,
   * which must match between the client and server applications.
   *
   * 配置基于浏览器的应用，使其可以从当前页面上的服务端渲染（SSR）应用过渡而来。
   * 指定的参数必须包含一个应用 id，在客户端应用和服务端应用之间它必须一致。
   *
   * @experimental
   */
  static withServerTransition(params: {appId: string}): ModuleWithProviders<BrowserModule> {
    return {
      ngModule: BrowserModule,
      providers: [
        {provide: APP_ID, useValue: params.appId},
        {provide: TRANSITION_ID, useExisting: APP_ID},
        SERVER_TRANSITION_PROVIDERS,
      ],
    };
  }
}
