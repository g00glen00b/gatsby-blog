import React from "react"
import {graphql} from "gatsby"
import {SEO} from '../components/Seo';
import {Layout} from '../components/Layout';
import {Pagination} from '../components/Pagination';
import {PostCardContainer} from "../components/PostCardContainer";
import PropTypes from 'prop-types';

const Posts = ({data: {allMarkdownRemark}, pageContext}) => (
  <Layout>
    <h1 className="page__title">
      Posts
    </h1>
    <SEO title="Posts"/>
    <PostCardContainer posts={allMarkdownRemark.edges}/>
    <Pagination
      pageCount={pageContext.pageCount}
      currentPage={pageContext.currentPage}
      base={pageContext.base}/>
  </Layout>
);

export const query = graphql`
  query($skip: Int!, $limit: Int!) {
    allMarkdownRemark(sort: {fields: frontmatter___date, order: DESC}, skip: $skip, limit: $limit) {
      edges {
        node {
          excerpt(format: PLAIN)
          frontmatter {
            categories
            tags
            title
            daysAgo: date(difference: "days")
            excerpt
            featuredImage {
              childImageSharp {
                gatsbyImageData(layout: CONSTRAINED, width: 80)
              }
            }
          }
          fields {
            slug
          }
          id
          fileAbsolutePath
          timeToRead
        }
      }
    }
  }
`;

export default Posts;

Posts.propTypes = {
  data: PropTypes.shape({
    allMarkdownRemark: PropTypes.shape({
      edges: PropTypes.arrayOf(PropTypes.shape({
        node: PropTypes.shape({
          id: PropTypes.string.isRequired,
          excerpt: PropTypes.string,
          timeToRead: PropTypes.number,
          frontmatter: PropTypes.shape({
            categories: PropTypes.arrayOf(PropTypes.string),
            tags: PropTypes.arrayOf(PropTypes.string),
            daysAgo: PropTypes.number,
            title: PropTypes.string,
            excerpt: PropTypes.string,
            featuredImage: PropTypes.shape({
              childImageSharp: PropTypes.shape({
                gatsbyImageData: PropTypes.object
              })
            })
          }),
          fields: PropTypes.shape({
            slug: PropTypes.string
          })
        })
      }))
    })
  }),
  pageContext: PropTypes.shape({
    base: PropTypes.string.isRequired,
    currentPage: PropTypes.number.isRequired,
    pageCount: PropTypes.number.isRequired
  })
};
