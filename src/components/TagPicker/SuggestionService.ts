import { from, Subject } from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
    switchMap,
    takeUntil,
    tap,
} from 'rxjs/operators';

import _ from 'lodash';


const vietnameseMap = [{
    "a": ["à", "á", "ạ", "ả", "ã", "â", "ầ", "ấ", "ậ", "ẩ", "ẫ", "ă", "ằ", "ắ", "ặ", "ẳ", "ẵ"]
}, {
    "e": ["è", "é", "ẹ", "ẻ", "ẽ", "ê", "ề", "ế", "ệ", "ể", "ễ"]
}, {
    "i": ["ì", "í", "ị", "ỉ", "ĩ"]
}, {
    "o": ["ò", "ó", "ọ", "ỏ", "õ", "ô", "ồ", "ố", "ộ", "ổ", "ỗ", "ơ", "ờ", "ớ", "ợ", "ở", "ỡ"]
}, {
    "u": ["ù", "ú", "ụ", "ủ", "ũ", "ư", "ừ", "ứ", "ự", "ử", "ữ"]
}, {
    "y": ["ỳ", "ý", "ỵ", "ỷ", "ỹ"]
}, {
    "d": ["đ"]
}];

export default class SuggestionService {
    private _subject = new Subject<any>();
    private _tapSubject = new Subject<string>();
    private _loadingSubject = new Subject<boolean>();
    private _defaultOptions = [];
    private _loadOptions: any;
    private _fastQuery: any;
    private _querySize: number;
    private _suggestFields: string[];

    public loading = this._loadingSubject.asObservable();

    public constructor(options = [], querySize: number = 0,
        suggestFields: string[] = ["value", "label"],
        loadOptions = null, fastQuery = null) {
        this._suggestFields = suggestFields;
        this._defaultOptions = options;
        this._querySize = querySize;
        this._loadOptions = loadOptions;
        this._fastQuery = fastQuery;
    }

    private _replaceSpecialChars = (string) => {
        return string.replace(/-/g, ' ')
    }

    private _normalize = (string) => {
        string = this._replaceSpecialChars(string)
        return string
            .split('')
            .map(char => {
                for (let value of vietnameseMap) {
                    if (Object.values(value)[0].indexOf(char) > -1) {
                        return Object.keys(value)[0]
                    }
                }
                return char
            })
            .join('')
    }

    private _filterOption = (option, inputValue) => {
        if (inputValue.length == 0) {
            return true;
        }

        const searchText = this._querySize == 0
            ? inputValue
            : _.chunk(inputValue.split(""), this._querySize).pop().join("");


        option = option.hasOwnProperty("data") ? option["data"] : option

        for (var key in option) {
            if (
                option.hasOwnProperty(key)
                && this._suggestFields.indexOf(key) >= 0
            ) {
                const data = option[key].toString().toLowerCase();
                const query = key == "value" ? searchText.toLowerCase() : inputValue.toLowerCase();
                if (this._normalize(data).indexOf(this._normalize(query)) >= 0) {
                    return true;
                }
            }
        }
        return false;
    }

    public setDefaultOptions(options) {
        this._defaultOptions = options;
    }

    public setRemoteQuery(loadOptions: any, fastQuery: any) {
        this._loadOptions = loadOptions;
        this._fastQuery = fastQuery;
    }

    public loadOptions = async (inputValue) => {
        if (inputValue == "") {
            return this._defaultOptions;
        }
        this._loadingSubject.next(true);

        const searchText = this._querySize != 0
            ? _.chunk(inputValue.split(""), this._querySize)
                .map(a => a.join("")).pop()
            : this._querySize;

        const remote = this._loadOptions ? await this._loadOptions(searchText, this._querySize) : [];
        const local = this._defaultOptions.filter(e => this._filterOption(e, searchText));
        return [...local, ...remote];
    }

    public fastQuery = async (inputValue) => {
        return this._fastQuery(inputValue);
    }

    public handleTapPressed = async (selectedItem: any[], inputValue: string, querySize: number) => {
        this._tapSubject.next("cancel loadOptions");

        const queries = _.chunk(inputValue.split(""), querySize)
            .map(a => a.join(""));

        const offlineFilter = (queryStates, options) => {
            if (!Array.isArray(options)) return queryStates;
            return queryStates.map(qs => {
                if (qs.resolved) return qs;
                const matched = options.find((opt) => opt.value == qs.query);
                return {
                    ...qs,
                    "resolved": matched != undefined,
                    "option": matched
                }
            });
        }

        let queryStates = queries.map(e => {
            return {
                "query": e,
                "resolved": false,
                "option": {}
            };
        });

        // select from default options
        queryStates = offlineFilter(queryStates, this._defaultOptions);

        const unResolveds = queryStates.filter(qs => !qs.resolved);

        let newSelected = queryStates.filter(qs => qs.resolved).map(e => e.option);

        if (unResolveds.length != 0 && this._fastQuery != null) {
            this._loadingSubject.next(true);
            const fetched = await this.fastQuery(unResolveds.map(e => e.query).join(""));
            newSelected = newSelected.concat(fetched);
        }
        this._loadingSubject.next(false);

        return _.uniqBy(selectedItem.concat(newSelected), 'value');
    }

    public onQueryChange = query => this._subject.next(query);

    public onSuggestion = () => this._subject
        .pipe(
            debounceTime(250),
            distinctUntilChanged(),
            switchMap(q => from(this.loadOptions(q))),
            tap(val => {
                this._loadingSubject.next(false);
            }),
            takeUntil(this._tapSubject.asObservable()),
        )
}

