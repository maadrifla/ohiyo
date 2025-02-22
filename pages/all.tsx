import { GetServerSideProps } from "next"
import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import ContentList from '../components/ContentList'
import Head from 'next/head'
import NavigationWrapper from '../containers/NavigationWrapper'
import TabIndicator from '../components/TabIndicator'
import Link from 'next/link'
import { useRef } from "react"
import { MENU_ENTRIES } from "../utils/Constants"

export const getServerSideProps: GetServerSideProps = async (context) => {
    let props: Record<string,any> = {}

    let offset = 0
    // Detect which page is requested (infinite scroll)
    const page = context.query.page ? parseInt(context.query.page.toString()) : 1
    if ( page > 1 ) {
        offset = 25 * (page - 1)
    }

    props.page = page

    const search = context.query.search
    const type = context.query.m ? "movies" : "anime"
    if (context.query.m) { 
        props.movies = true
    } else {
        props.movies = false
    }

    let res: Response
    if (search && search.length > 0) {
        res = await fetch(`https://animeify.net/animeify/apis_v2/${type}/filtersort/search.php`, {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/x-www-form-urlencoded"
            }),
            body: `UserID=0&Language=AR&Text=${search}&From=${offset}`
        })
        props.search = search
    } else if (context.query.genre) {
        res = await fetch(`https://animeify.net/animeify/apis_v2/${type}/filtersort/genre.php`, {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/x-www-form-urlencoded"
            }),
            body: `UserID=0&Language=AR&GenreList=${context.query.genre}&From=${offset}`
        })
        props.genreSelected = context.query.genre
    } else if (context.query.studio) {
        res = await fetch(`https://animeify.net/animeify/apis_v2/${type}/filtersort/studios.php`, {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/x-www-form-urlencoded"
            }),
            body: `UserID=0&Language=AR&StudiosList=${context.query.studio}&From=${offset}`
        })
        props.studioSelected = context.query.studio
    } else {
        res = await fetch(`https://animeify.net/animeify/apis_v2/${type}/catalog${type == "movies" ? "movies" : "series"}.php`, {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/x-www-form-urlencoded"
            }),
            body: `UserID=0&Language=AR&From=${offset}`
        })
    }

    if (res && res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length) {
            props.results = {
                status: "success",
                data: data
            }
        } else {
            props.results = {
                status: "not-found",
                data: []
            }
        }
    } else {
        props.results = {
            status: "error",
            data: []
        }
    }

    return {
        props
    }
}

const All = ({ results, page, genreSelected, search, studioSelected, movies }) => {

    const router = useRouter()
    const [ result, updateResult ] = useState<Record<string,any>>({
        status: "",
        data: []
    })
    const [ refreshed, updateRefreshed ] = useState<boolean>(false)
    const [ searchValue, updateSearchValue ] = useState<string>(search)
    const [ currentPage, updateCurrent ] = useState<number>(1)
    const [ queryInit, updateQueryInit ] = useState<boolean>(false)
    const [ actualQuery, updateActualQuery ] = useState<Record<string,any>>(() => ({
        ...(genreSelected && {genre: genreSelected}),
        ...(studioSelected && {studio: studioSelected}),
        ...(search && {search}),
        ...(movies && {m: 1})
    }))
    const hamburgerButton = useRef()
    const bottomDetector = useRef()
    
    useEffect(() => {
        if (queryInit) {
            if (!searchValue.length) {
                deleteQueryParam("search", true)
            } else {
                updateActualQuery({
                    ...actualQuery,
                    search: searchValue,
                    page: 1
                })        
            }
        }
    }, [searchValue])

    useEffect(() => {
        if (Object.keys(results).length) {
            if ( results.status == "success" && page == 1 ) {
                updateResult(results)
                updateCurrent(1)
                updateRefreshed(true)
            } else if ( results.status == "success" && page != currentPage ) {
                updateResult(oldResults => {
                    return {
                        ...oldResults,
                        status: results.status,
                        data: oldResults.data.concat(results.data)
                    }
                })
                updateCurrent(page)
                updateRefreshed(true)
            }
        }
    }, [results])

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (refreshed && entries[0] && entries[0].isIntersecting) {
                updateRefreshed(false)
                updateActualQuery({ ...actualQuery, page: page + 1 })
            }
        })
        if (bottomDetector.current) {
            observer.observe(bottomDetector.current)
        }

        return () => {
            observer.disconnect()
        }
    }, [page,refreshed,actualQuery])

    useEffect(() => {
        if (router.isReady) {
            if (queryInit) {
                let urlQuery = actualQuery
                if (urlQuery.page == 1) {
                    delete urlQuery.page
                }
                router.push({
                    pathname: "/all",
                    query: { ...urlQuery }
                }, undefined, { scroll: false })
            } else {
                updateQueryInit(true)
            }
        }
    }, [actualQuery])

    const deleteQueryParam = (param: string, reset: boolean) => {
        if (actualQuery[param]) {
            let q = { ...actualQuery }
            if (reset) {
                q.page = 1
            }
            delete q[param]
            updateActualQuery(q)
        }
    }

    return (
        <>
            <Head>
                <title>قائمة الأنمي</title>
                <meta name="keywords" content="anime,animayhem,all,list,anime list,anime slayer,translated,arabic,slayer,أنمي,مترجم,أنمي سلاير,لائحة الأنمي,أنمايهم"/>
                <meta name="description" content="اختر الأنمي ضمن القائمة أو إبحث عن الأنمي"/>
                <meta property="og:title" content="Animayhem - قائمة الأنمي"/>
                <meta property="og:site_name" content="Animayhem"/>
                <meta property="og:url" content="https://www.animayhem.ga/all" />
                <meta property="og:description" content="اختر الأنمي ضمن القائمة أو إبحث عن الأنمي" />
                <meta property="og:type" content="website" />
            </Head>
            <NavigationWrapper navTrigger={ hamburgerButton } contentId="all" selected="list-all">
                <div id="all-page" className="content-page">
                    <div className="anime-list-header">
                        <h2 className="section-title"><span ref={ hamburgerButton } id="hamburger-menu" className="mdi mdi-menu"></span>{ MENU_ENTRIES.find(entry => entry.id == "list-all").title }</h2>
                        <div className="anime-search-container">
                            <input onInput={ (e: React.ChangeEvent<HTMLInputElement>) => updateSearchValue(e.target.value) } value={ searchValue } placeholder="البحث عن الأنمي" type="text" name="anime-search" id="anime-search"/>
                        </div>
                    </div>

                    <TabIndicator items={{
                        series: {
                            title: "الأنمي",
                            icon: "mdi mdi-television-classic"
                        },
                        movies: {
                            title: "الأفلام",
                            icon: "mdi mdi-filmstrip-box"
                        }
                    }} setTab={ (tab) => {
                        if (tab == "movies") {
                            updateActualQuery({ ...actualQuery, m: 1, page: 1 })
                        } else {
                            deleteQueryParam("m", true)
                        } 
                    }} selected={ movies ? "movies" : "series" } />

                    { genreSelected ?
                        <p id="genre-filter-info" className="list-notice"><span className="mdi mdi-filter"></span>أنمي من نوع <strong style={{ color: "#fffb00" }}>{ genreSelected }</strong>. <Link href="/all" scroll={ true } ><a className="link">إلغاء</a></Link></p>
                    : null }
                    { studioSelected ?
                        <p id="studio-filter-info" className="list-notice"><span className="mdi mdi-filter"></span>أعمال استوديو <strong dir="ltr" style={{ color: "#fffb00" }}>{ studioSelected }</strong>. <Link href="/all" scroll={ true } ><a className="link">إلغاء</a></Link></p>
                    : null }

                    <ContentList overrideMovie={ movies } latest={ false } className="content-list" contentList={ page == 1 ? results.data : result.data } />
                    { result.data.length % 25 == 0 ? <div ref={ bottomDetector } className="bottom-detector"></div> : null }
                </div>
            </NavigationWrapper>
        </>
    )
}

export default All