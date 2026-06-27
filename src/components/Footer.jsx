export default function Footer() {
  return (
    <footer>
      <div className="container mt-5">
        <div className="row pt-4 gy-4">
          <div className="col-md-6">
            <div className="row">
              <div className="col-6">
                <h6 className="fw-semibold fs-5">EXAMINATION SYSTEM</h6>
                <p>This is the final exam of math 6th semester</p>
              </div>
              <div className="col-6">
                <h6 className="fw-bolder">INFORMATION</h6>
                <p>ABOUT US</p>
                <p>FAQ</p>
                <p>CONTACT US</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="row">
              <div className="col-6">
                <h6 className="fw-bolder">QUICK LINKS</h6>
                <p>HOME</p>
                <p>EXAMS</p>
                <p>ABOUT</p>
              </div>
              <div className="col-6">
                <h6 className="fw-bolder">FOLLOW US</h6>
                <div className="d-flex gap-3 fs-5">
                  <a className="text-white" href="https://www.facebook.com/" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
                  <a className="text-white" href="https://x.com/" aria-label="Twitter"><i className="fa-brands fa-twitter" /></a>
                  <a className="text-white" href="https://www.linkedin.com/" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in" /></a>
                  <a className="text-white" href="https://www.youtube.com/" aria-label="YouTube"><i className="fa-brands fa-youtube" /></a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <hr className="my-4" />
        <p className="text-center pb-3 mb-0">Copyright 2025. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
