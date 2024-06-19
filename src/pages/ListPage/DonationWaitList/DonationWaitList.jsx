import React, { useCallback, useEffect, useRef, useState } from "react";
import useAsync from "../../../hooks/useAsync";
import { getDonationList } from "../../../api/donationsApi";
import Slider from "react-slick";
import TitleSection from "../../../components/TitleSection/TitleSection";
import LodingImage from "../../../components/LodingImage/LodingImage";
import Card from "./DonationList/DonationCard.jsx";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import CaretButton from "../../../components/CaretButton/CaretButton.jsx";

const PAGE_SIZES = {
	desktop: 100,
	tablet: 100,
	mobile: 100,
};

function DonationWaitList({ mode, myCreditState }) {
	const pageSize = PAGE_SIZES[mode];
	const sliderRef = useRef(null);
	const [load, setLoad] = useState(0);
	const [idols, setIdols] = useState([]);
	const [cursor, setCursor] = useState(null);
	const [disableButton, setDisableButton] = useState(true);

	const { refetchFunction, pending, error } = useAsync(getDonationList);

	const getDataList = useCallback(
		async (cursor) => {
			try {
				const params = { pageSize: pageSize * 2 };
				if (cursor) {
					params.pageSize = pageSize;
					params.cursor = cursor;
				}

				const data = await refetchFunction(params);
				if (data) {
					// 👽 데이터 중복 방지 로직 추가
					setIdols((prev) => {
						const newData = data.list.filter((item) => !prev.some((prevItem) => prevItem.id === item.id));
						return [...prev, ...newData];
					});
					setCursor(data.nextCursor);
				}
			} finally {
				setDisableButton(false);
			}
		},
		[refetchFunction, pageSize],
	);

	const slickNext = async () => {
		try {
			setDisableButton(true);
			if (cursor !== null) await getDataList(cursor);
		} finally {
			sliderRef.current.slickNext();
			setDisableButton(false);
		}
	};

	const slickPrev = () => {
		return sliderRef.current.slickPrev();
	};

	useEffect(() => {
		getDataList();
	}, [getDataList, load]);

	const settings = {
		rows: 1, //이미지를 몇 줄로 표시할지 개수
		dots: false, //슬라이더 아래에 도트 네비게이션 버튼 표시 여부
		//draggable: false, //슬라이드 드래그 가능여부
		arrows: false, //이전 다음 버튼 표시 여부
		speed: 500,
		centerPadding: "0px", //중앙에 슬라이드가 보여지는 모드에서 패딩 값
		infinite: false,
		variableWidth: true, // 👽 12시간만에 찾아낸 width 조정 해결책 ㅠㅠㅠㅠㅠ
		responsive: [
			{
				//작은 사이즈
				breakpoint: 1200,
				settings: {
					arrows: false, //이전 다음 버튼 표시 여부
					draggable: true, //슬라이드 드래그 가능여부
					//slidesToShow: 3,
					slidesToScroll: "auto",
					dots: true,
					centerMode: true,
					infinite: false,
				},
			},
		],
	};

	return (
		<TitleSection title={"후원을 기다리는 조공"} carousel={true} size={"normal"}>
			{pending && idols.length === 0 && <LodingImage />}
			{error && (
				<>
					<p>{error.message}에러발생🦄</p>
					<button onClick={() => setLoad((prev) => ++prev)}>RELOAD</button>
				</>
			)}
			<Slider ref={sliderRef} {...settings}>
				{idols &&
					idols?.map((item) => (
						<div key={item.id} style={{ padding: "0 10px" }}>
							<Card key={item.id} item={item} size={mode === "mobile" ? "small" : "medium"} myCreditState={myCreditState} />
						</div>
					))}
			</Slider>
			{mode === "desktop" && (
				<>
					{/* 이전 다음 버튼 */}
					<CaretButton direction="right" onClick={slickNext} disabled={disableButton} />
					<CaretButton direction="left" onClick={slickPrev} disabled={disableButton} />
				</>
			)}
		</TitleSection>
	);
}

export default DonationWaitList;

//<article style={{ width: "1200px", margin: "0 auto" }}>
