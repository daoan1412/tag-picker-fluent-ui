import React from 'react'

import TagPicker from './TagPicker'

export default {
    title: 'TagPicker title',
    component: TagPicker
}

const defaultOptions = [
    'Bộ Công an',
    'Bộ Công Thương',
    'Bộ Giáo dục và Đào tạo',
    'Bộ Giao thông vận tải',
    'Bộ Kế hoạch và Đầu tư',
    'Bộ Khoa học và Công nghệ',
    'Bộ Lao động - Thương Binh và Xã hội',
    'Bộ ngoại giao',
    'Bộ Nội vụ',
    'Bộ Nông nghiệp và phát triển nông thôn',
].map((e, i) => {
    const value = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`;
    return { "value": value, "label": `${value} - ${e}`, "title": e };
});

export const Basic = () => (
    <TagPicker
        placeholder="Nhập mã nơi gửi"
        defaultOptions={defaultOptions}
        suggestFields={["value", "label"]}
        querySize={2}
        // loadOptions={async (query) => {
        //         const {data} = await axios.get("http://localhost:3001/search?term=" + query);
        //         return data;
        // }}
        // fastQuery={async (query) => {
        //     const {data} = await axios.get("http://localhost:3001/fast-query?size=2&term=" + query);
        //     return data;
        // }}
        tokenField={"value"}
        onChange={(e) => {
        }}
    />
)

