import {bootstrap} from 'angular2/platform/browser'
import {HTTP_PROVIDERS} from 'angular2/http'
import {Comments} from './comments/Comments'
import {ActionService} from './services/ActionService'
import {ApiService} from './services/ApiService'
import {TabService} from './services/TabService'
import 'rxjs/Rx'
import {App} from './app'
import {ApiService} from './services/ApiService'
import {BodyTransformService} from './services/BodyTransformService'
import {EventService} from './services/EventService'
import {ModelService} from './services/ModelService'
import {SettingsService} from './services/SettingsService'
import {ShackMessageService} from './services/ShackMessageService'
import {TabService} from './services/TabService'
import {TitleService} from './services/TitleService'

bootstrap(App, [
    HTTP_PROVIDERS,
    ActionService,
    ApiService,
    BodyTransformService,
    EventService,
    ModelService,
    SettingsService,
    ShackMessageService,
    TabService,
    TitleService,
    Comments
])
