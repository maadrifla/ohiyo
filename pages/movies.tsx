import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import ContentList from '../components/ContentList'
import NavigationWrapper from '../containers/NavigationWrapper'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useRef } from 'react'
import { MENU_ENTRIES } from '../utils/Constants'

export const getServerSideProps: GetServerSideProps = async (context) => {

    let props: Record<string,any> = {}

    const page = context.query.page ? parseInt(context.query.page.toString()) : 1
    props.page = page

    let offset: number = 25 * (page - 1)
    let res: Response
    res = await fetch("https://animeify.net/animeify/apis_v2/anime/latest_anime.php", {
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/x-www-form-urlencoded"
        }),
        body: `UserId=0&Type=Movie&Language=AR&From=${offset}`
    })
    if (res.ok) {
        const data = await res.json()
        if (data) {
            props.newMovies = data
        }
    } else {
        props.newMovies = []
    }
    
    return {
        props
    }
}

export default function Movies({ newMovies, page }) {

    const [ data, updateData ] = useState<Record<string,any>[]>([])
    const [ refreshed, updateRefreshed ] = useState<boolean>(false)
    const [ searchValue, updateSearchValue ] = useState<string>('')
    const hamburgerButton = useRef()
    const bottomDetector = useRef()
    const router = useRouter()

    useEffect(() => {
        if (newMovies.length) {
            if (page == 1) {
                updateData(newMovies)
            } else {
                updateData(oldData => oldData.concat(newMovies))
            }
            updateRefreshed(true)
        }
    }, [newMovies])

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (refreshed && entries[0] && entries[0].isIntersecting) {
                updateRefreshed(false)
                router.push({
                    pathname: "/movies",
                    query: { ...router.query, page: page + 1 }
                }, undefined, { scroll: false })
            }
        })
        if (bottomDetector.current) {
            observer.observe(bottomDetector.current)
        }

        return () => {
            observer.disconnect()
        }
    }, [page,refreshed])

    const handleSubmit = (event:React.FormEvent) => {
        event.preventDefault()
        if (searchValue.length) {
            router.push({
                pathname: "/all",
                query: {
                    search: searchValue,
                    m: 1
                }
            })
        }
    }

    return (
        <>
            <Head>
                <title>آخر الأفلام</title>
                <meta name="keywords" content="anime,animayhem,anime slayer,translated,movies,arabic,slayer,أفلام,أنمي,مترجم,أنمي سلاير,أنمايهم"/>
                <meta name="description" content="شاهد آخر أفلام الأنمي المترجمة بجودة عالية على موقعنا"/>
                <meta property="og:title" content="Animayhem - أنمي مترجم"/>
                <meta property="og:site_name" content="Animayhem"/>
                <meta property="og:url" content="https://animayhem.ga" />
                <meta property="og:description" content="شاهد آخر أفلام الأنمي المترجمة بجودة عالية على موقعنا" />
                <meta property="og:type" content="website" />
            </Head>
            <NavigationWrapper navTrigger={ hamburgerButton } contentId="movies" selected="movies">
                <div id="movies-page" className="content-page">
                    <div className="anime-list-header">
                        <h2 className="section-title"><span ref={ hamburgerButton } id="hamburger-menu" className="mdi mdi-menu"></span>{ MENU_ENTRIES.find(entry => entry.id == "movies").title }</h2>
                        <form onSubmit={ handleSubmit } className="anime-search-container">
                            <input onInput={ (e: React.ChangeEvent<HTMLInputElement>) => updateSearchValue(e.target.value) } placeholder="البحث عن الأفلام" type="text" name="anime-search" id="anime-search"/>
                        </form>
                    </div>
                    { data.length < page * 25 && page != 1 ? 
                    <p id="page-warning" className="list-notice"><span className="mdi mdi-information"></span>أنت الآن في الصفحة { page }. <Link href="/movies" scroll={ true } ><a className="link">العودة للصفحة الأولى</a></Link></p>
                    : null }
                    <ContentList latest={ false } className="content-list" contentList={ page == 1 ? newMovies : data } />
                    <div ref={ bottomDetector } className="bottom-detector"></div>
                </div>
            </NavigationWrapper>
        </>
    )
}
